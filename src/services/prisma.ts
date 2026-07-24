import { PrismaClient } from '../generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { seedDemoDataIfEmpty, ensureSimplePosUsers } from './DemoDataService.ts'
import { ensureDefaultTenant } from './tenant/TenantBootstrapService.ts'
import { storeContext } from './tenant/StoreContext.ts'

export type { PrismaClient }
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

function resolveModuleDir(): string {
  try {
    return path.dirname(fileURLToPath(import.meta.url))
  } catch {
    return process.cwd()
  }
}

function resolveProjectRoot(): string {
  if (process.env.APP_ROOT) return process.env.APP_ROOT
  // Bundled main lives in dist-electron/; source lives in src/services/
  const moduleDir = resolveModuleDir()
  if (path.basename(moduleDir) === 'dist-electron' || moduleDir.endsWith(`${path.sep}dist-electron`)) {
    return path.join(moduleDir, '..')
  }
  return path.join(moduleDir, '..', '..')
}

let prisma: PrismaClient | null = null

function resolveDbPath(): string {
  if (process.env.POS_DB_PATH) return process.env.POS_DB_PATH
  return path.join(resolveProjectRoot(), 'prisma', 'dev.db')
}

/** libSQL expects a file: URL; Windows absolute paths need file:///C:/... */
function toLibsqlFileUrl(dbPath: string): string {
  const absolute = path.resolve(dbPath)
  const normalized = absolute.replace(/\\/g, '/')
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${normalized}`
  }
  return `file:${normalized}`
}

function resolveMigrationsDir(): string | null {
  const candidates = [
    process.env.POS_MIGRATIONS_PATH,
    path.join(resolveProjectRoot(), 'prisma', 'migrations'),
    typeof (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath === 'string'
      ? path.join((process as NodeJS.Process & { resourcesPath?: string }).resourcesPath!, 'prisma', 'migrations')
      : null,
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const dbPath = resolveDbPath()
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const adapter = new PrismaLibSql({ url: toLibsqlFileUrl(dbPath) })
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

export function getDatabaseFilePath(): string {
  return resolveDbPath()
}

async function tableCount(db: PrismaClient): Promise<number> {
  const rows = await db.$queryRawUnsafe<Array<{ c: number | bigint }>>(
    `SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
  )
  return Number(rows[0]?.c ?? 0)
}

async function hasCoreSchema(db: PrismaClient): Promise<boolean> {
  try {
    await db.$queryRawUnsafe(`SELECT 1 FROM "Setting" LIMIT 1`)
    await db.$queryRawUnsafe(`SELECT 1 FROM "Product" LIMIT 1`)
    return true
  } catch {
    return false
  }
}

async function resetDatabaseFile(): Promise<void> {
  await disconnectPrisma()
  const dbPath = resolveDbPath()
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const file = `${dbPath}${suffix}`
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}

function isIgnorableMigrationError(message: string): boolean {
  return (
    /duplicate column name/i.test(message) ||
    /already exists/i.test(message) ||
    /duplicate column/i.test(message)
  )
}

async function applySqlFile(db: PrismaClient, sqlPath: string): Promise<void> {
  const sql = fs.readFileSync(sqlPath, 'utf8')
  // Strip SQL line comments first. Prisma migrations prefix statements with
  // "-- CreateTable" etc.; discarding those lines must not drop the CREATE itself.
  const withoutComments = sql
    .split(/\r?\n/)
    .map((line) => (line.trimStart().startsWith('--') ? '' : line))
    .join('\n')

  const statements = withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    try {
      await db.$executeRawUnsafe(statement)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (isIgnorableMigrationError(message)) continue
      throw err
    }
  }
}

async function ensureMigrationsTable(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )`,
  )
}

async function getAppliedMigrations(db: PrismaClient): Promise<Set<string>> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ migration_name: string }>>(
      `SELECT "migration_name" FROM "_prisma_migrations"`,
    )
    return new Set(rows.map((r) => r.migration_name))
  } catch {
    return new Set()
  }
}

async function applyPendingMigrations(db: PrismaClient): Promise<void> {
  const migrationsDir = resolveMigrationsDir()
  if (!migrationsDir) {
    if (!(await hasCoreSchema(db))) {
      throw new Error(
        'Local database has no schema and migration files were not found. Reinstall the application.',
      )
    }
    return
  }

  await ensureMigrationsTable(db)
  const applied = await getAppliedMigrations(db)

  const migrationFolders = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  for (const folder of migrationFolders) {
    if (applied.has(folder)) continue
    const sqlPath = path.join(migrationsDir, folder, 'migration.sql')
    if (!fs.existsSync(sqlPath)) continue

    await applySqlFile(db, sqlPath)
    await db.$executeRawUnsafe(
      `INSERT OR IGNORE INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, 1)`,
      folder,
      'bootstrap',
      folder,
    )
  }
}

/** Ensures the SQLite file exists and schema is up to date. */
export async function ensureDatabaseReady(): Promise<void> {
  let db = getPrisma()
  const count = await tableCount(db)

  if (count > 0 && !(await hasCoreSchema(db))) {
    // Half-applied / corrupted schema from a previous failed bootstrap.
    await resetDatabaseFile()
    db = getPrisma()
  }

  await applyPendingMigrations(db)

  if (!(await hasCoreSchema(db))) {
    throw new Error('Database bootstrap completed but core tables were not created.')
  }

  await seedDemoDataIfEmpty()
  await ensureSimplePosUsers()

  const tenant = await ensureDefaultTenant()
  storeContext.set(tenant.businessId, tenant.storeId)
}
