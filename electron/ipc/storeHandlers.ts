import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { StoreService } from '../../src/services/StoreService.ts'
import { StockTransferService } from '../../src/services/StockTransferService.ts'
import { getSyncService } from '../../src/services/sync/SyncService.ts'
import { parseIpcArg, idSchema } from '../../src/shared/ipcValidation.ts'
import { getPrisma } from '../../src/services/prisma.ts'
import { verifyPassword } from '../../src/services/auth/password.ts'
import { getAuthSession, setAuthSession } from '../../src/services/auth/session.ts'
import { CloudApiClient } from '../../src/services/cloud/CloudApiClient.ts'

const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  address: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal('')),
})

const transferSchema = z.object({
  fromStoreId: z.string().min(1),
  toStoreId: z.string().min(1),
  note: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export function registerStoreHandlers() {
  const stores = new StoreService()
  const transfers = new StockTransferService()
  const sync = getSyncService()
  const cloud = new CloudApiClient()

  ipcMain.handle(IPC.STORE_LIST, () => stores.listForBusiness())
  ipcMain.handle(IPC.STORE_GET_ACTIVE, () => stores.getActive())
  ipcMain.handle(IPC.STORE_SET_ACTIVE, async (_e, storeId) => {
    const id = parseIpcArg(idSchema, storeId, 'storeId')
    return stores.setActiveStore(id)
  })
  ipcMain.handle(IPC.STORE_CREATE, (_e, input) =>
    stores.create(parseIpcArg(createStoreSchema, input, 'store')),
  )

  ipcMain.handle(IPC.STOCK_TRANSFER_LIST, () => transfers.list())
  ipcMain.handle(IPC.STOCK_TRANSFER_CREATE, (_e, input) =>
    transfers.createAndComplete(parseIpcArg(transferSchema, input, 'transfer')),
  )

  ipcMain.handle(IPC.SYNC_STATUS, () => sync.getStatus())
  ipcMain.handle(IPC.SYNC_NOW, () => sync.syncNow())

  ipcMain.handle(IPC.AUTH_ME, () => getAuthSession())
  ipcMain.handle(IPC.AUTH_LOGOUT, () => {
    setAuthSession(null)
    sync.setAccessToken(null)
    return { ok: true }
  })
  ipcMain.handle(IPC.AUTH_LOGIN, async (_e, raw) => {
    const { email, password } = parseIpcArg(loginSchema, raw, 'credentials')
    const db = getPrisma()

    // Prefer cloud when configured; fall back to local SQLite users for offline POS.
    if (await cloud.isConfigured()) {
      try {
        const tokens = await cloud.login(email, password)
        sync.setAccessToken(tokens.accessToken)
        const local = await db.user.findUnique({ where: { email } })
        const memberships = local
          ? await db.userStore.findMany({ where: { userId: local.id }, select: { storeId: true } })
          : []
        const session = {
          userId: local?.id || email,
          email,
          name: local?.name || email,
          role: local?.role || 'CASHIER',
          businessId: local?.businessId ?? null,
          storeIds: memberships.map((m) => m.storeId),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        }
        setAuthSession(session)
        return session
      } catch {
        // fall through to local
      }
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.isActive || !verifyPassword(password, user.password)) {
      throw new Error('Invalid email or password')
    }
    const memberships = await db.userStore.findMany({
      where: { userId: user.id },
      select: { storeId: true },
    })
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      storeIds: memberships.map((m) => m.storeId),
    }
    setAuthSession(session)
    return session
  })
}
