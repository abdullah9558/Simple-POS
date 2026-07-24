import Fastify from 'fastify'
import { z } from 'zod'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PORT = Number(process.env.PORT || 8787)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const derived = scryptSync(password, salt, 64)
  return timingSafeEqual(hashBuffer, derived)
}

/** Lightweight unsigned JWT for local/dev; replace with proper signing in production. */
function signAccessToken(payload: Record<string, unknown>, expiresInSec = 900): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
      iss: 'pos-cloud-api',
    }),
  ).toString('base64url')
  const sig = createHash('sha256').update(`${header}.${body}.${JWT_SECRET}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function verifyAccessToken(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expected = createHash('sha256').update(`${header}.${body}.${JWT_SECRET}`).digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(Buffer.from(body!, 'base64url').toString('utf8')) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// In-memory stand-in so the API builds and runs without Postgres during desktop CI.
// Wire Prisma + DATABASE_URL for production cloud hosts.
const memory = {
  users: new Map<string, { id: string; email: string; name: string; password: string; role: string; businessId: string }>(),
  refresh: new Map<string, { userId: string; expiresAt: number }>(),
  mutations: new Set<string>(),
}

memory.users.set('admin@simplepos.com', {
  id: 'cloud-user-admin',
  email: 'admin@simplepos.com',
  name: 'Admin',
  password: hashPassword('Test@123'),
  role: 'OWNER',
  businessId: 'biz-default',
})
memory.users.set('manager@simplepos.com', {
  id: 'cloud-user-manager',
  email: 'manager@simplepos.com',
  name: 'Manager',
  password: hashPassword('Test@123'),
  role: 'MANAGER',
  businessId: 'biz-default',
})
memory.users.set('cashier@simplepos.com', {
  id: 'cloud-user-cashier',
  email: 'cashier@simplepos.com',
  name: 'Cashier',
  password: hashPassword('Test@123'),
  role: 'CASHIER',
  businessId: 'biz-default',
})

async function main() {
  const app = Fastify({ logger: true })

  app.get('/health', async () => ({ ok: true, service: 'pos-cloud-api' }))

  app.post('/auth/login', async (request, reply) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(request.body)
    const user = memory.users.get(body.email)
    if (!user || !verifyPassword(body.password, user.password)) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    })
    const refreshToken = randomBytes(32).toString('hex')
    memory.refresh.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
    return {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + 900_000,
    }
  })

  app.post('/auth/refresh', async (request, reply) => {
    const body = z.object({ refreshToken: z.string().min(1) }).parse(request.body)
    const entry = memory.refresh.get(body.refreshToken)
    if (!entry || entry.expiresAt < Date.now()) {
      return reply.code(401).send({ error: 'Invalid refresh token' })
    }
    const user = [...memory.users.values()].find((u) => u.id === entry.userId)
    if (!user) return reply.code(401).send({ error: 'User not found' })
    return {
      accessToken: signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      }),
      refreshToken: body.refreshToken,
      expiresAt: Date.now() + 900_000,
    }
  })

  app.post('/auth/logout', async (request) => {
    const body = z.object({ refreshToken: z.string().optional() }).parse(request.body ?? {})
    if (body.refreshToken) memory.refresh.delete(body.refreshToken)
    return { ok: true }
  })

  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/auth/') || request.url === '/health') return
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const payload = verifyAccessToken(header.slice(7))
    if (!payload) return reply.code(401).send({ error: 'Invalid token' })
    ;(request as { user?: unknown }).user = payload
  })

  app.get('/stores', async () => ({
    data: [
      { id: 'store-default', name: 'Main Store', code: 'MAIN', isActive: true },
      { id: 'store-downtown', name: 'Downtown Branch', code: 'DTN', isActive: true },
    ],
  }))

  app.get('/stores/:id/inventory', async (request) => {
    const { id } = request.params as { id: string }
    return { storeId: id, data: [] }
  })

  app.get('/stores/compare-inventory', async (request) => {
    const query = request.query as { storeIds?: string }
    return { storeIds: query.storeIds?.split(',') ?? [], rows: [] }
  })

  app.get('/sales', async (request) => {
    const query = request.query as { storeId?: string }
    return { storeId: query.storeId ?? null, data: [] }
  })

  app.post('/sync/push', async (request) => {
    const body = z.object({
      items: z.array(z.object({
        clientMutationId: z.string(),
        entityType: z.string(),
        entityId: z.string(),
        operation: z.string(),
        payload: z.unknown(),
      })),
    }).parse(request.body)

    const accepted: string[] = []
    const conflicts: Array<{ clientMutationId: string; reason: string }> = []
    const rejected: Array<{ clientMutationId: string; reason: string }> = []

    for (const item of body.items) {
      if (memory.mutations.has(item.clientMutationId)) {
        accepted.push(item.clientMutationId)
        continue
      }
      // Idempotent accept — production applies to Postgres with version checks.
      memory.mutations.add(item.clientMutationId)
      accepted.push(item.clientMutationId)
    }

    return { accepted, conflicts, rejected }
  })

  app.get('/sync/pull', async (request) => {
    const query = request.query as { since?: string; storeId?: string }
    return { since: query.since ?? null, storeId: query.storeId ?? null, changes: [] }
  })

  await app.listen({ port: PORT, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
