import { SyncQueueService } from './SyncQueueService.ts'
import { CloudApiClient } from '../cloud/CloudApiClient.ts'
import { getPrisma } from '../prisma.ts'
import { storeContext } from '../tenant/StoreContext.ts'

export interface SyncStatusSnapshot {
  online: boolean
  configured: boolean
  pendingCount: number
  lastSyncAt: string | null
  lastError: string | null
  syncing: boolean
}

/**
 * Background sync orchestrator: drains SyncQueue to the cloud REST API.
 * Checkout never waits on this service.
 */
export class SyncService {
  private queue = new SyncQueueService()
  private client = new CloudApiClient()
  private syncing = false
  private lastSyncAt: Date | null = null
  private lastError: string | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  start(intervalMs = 30_000) {
    if (this.timer) return
    this.timer = setInterval(() => {
      void this.syncNow().catch(() => undefined)
    }, intervalMs)
    void this.syncNow().catch(() => undefined)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async getStatus(): Promise<SyncStatusSnapshot> {
    const configured = await this.client.isConfigured()
    const pendingCount = await this.queue.countPending()
    return {
      online: configured ? await this.probeOnline() : false,
      configured,
      pendingCount,
      lastSyncAt: this.lastSyncAt?.toISOString() ?? null,
      lastError: this.lastError,
      syncing: this.syncing,
    }
  }

  async syncNow(): Promise<SyncStatusSnapshot> {
    if (this.syncing) return this.getStatus()
    this.syncing = true
    this.lastError = null

    try {
      const configured = await this.client.isConfigured()
      if (!configured) {
        this.lastError = null
        return this.getStatus()
      }

      if (!(await this.probeOnline())) {
        this.lastError = 'Offline — queued locally'
        return this.getStatus()
      }

      if (!this.accessToken) {
        this.lastError = 'Not authenticated with cloud — queue retained'
        return this.getStatus()
      }

      const pending = await this.queue.listPending(50)
      if (pending.length === 0) {
        this.lastSyncAt = new Date()
        return this.getStatus()
      }

      await this.queue.markInProgress(pending.map((p) => p.id))

      const result = await this.client.pushSync(
        pending.map((p) => ({
          clientMutationId: p.clientMutationId,
          entityType: p.entityType,
          entityId: p.entityId,
          operation: p.operation,
          payload: JSON.parse(p.payload) as unknown,
        })),
        this.accessToken,
      )

      const accepted = new Set(result.accepted)
      const conflicted = new Set(result.conflicts.map((c) => c.clientMutationId))
      const rejected = new Map(result.rejected.map((r) => [r.clientMutationId, r.reason]))

      for (const item of pending) {
        if (accepted.has(item.clientMutationId)) {
          await this.queue.markSynced(item.id)
        } else if (conflicted.has(item.clientMutationId)) {
          await getPrisma().syncQueue.update({
            where: { id: item.id },
            data: {
              status: 'CONFLICT',
              attempts: { increment: 1 },
              lastError: 'Conflict detected — owner resolve required',
            },
          })
          await getPrisma().auditLog.create({
            data: {
              storeId: storeContext.getActiveStoreId(),
              action: 'SYNC_CONFLICT',
              entityType: item.entityType,
              entityId: item.entityId,
              metadata: item.payload,
            },
          })
        } else {
          await this.queue.markFailed(
            item.id,
            rejected.get(item.clientMutationId) || 'Rejected by cloud',
          )
        }
      }

      this.lastSyncAt = new Date()
      return this.getStatus()
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err)
      await getPrisma().auditLog.create({
        data: {
          storeId: storeContext.getActiveStoreId(),
          action: 'SYNC_ERROR',
          entityType: 'SyncQueue',
          metadata: JSON.stringify({ error: this.lastError }),
        },
      }).catch(() => undefined)
      return this.getStatus()
    } finally {
      this.syncing = false
    }
  }

  private async probeOnline(): Promise<boolean> {
    try {
      const base = await this.client.getBaseUrl()
      if (!base) return false
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(`${base}/health`, { signal: controller.signal })
      clearTimeout(timeout)
      return res.ok
    } catch {
      return false
    }
  }
}

let singleton: SyncService | null = null

export function getSyncService(): SyncService {
  if (!singleton) singleton = new SyncService()
  return singleton
}
