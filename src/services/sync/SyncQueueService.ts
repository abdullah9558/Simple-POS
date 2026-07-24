import { randomUUID } from 'node:crypto'
import type { TransactionClient } from '../prisma.ts'
import { getPrisma } from '../prisma.ts'

export interface EnqueueSyncInput {
  entityType: string
  entityId: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  payload: unknown
  clientMutationId?: string
}

export async function enqueueSync(
  tx: TransactionClient | null,
  input: EnqueueSyncInput,
): Promise<void> {
  const db = tx ?? getPrisma()
  await db.syncQueue.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      operation: input.operation,
      payload: JSON.stringify(input.payload),
      clientMutationId: input.clientMutationId || randomUUID(),
      status: 'PENDING',
    },
  })
}

export class SyncQueueService {
  private get db() {
    return getPrisma()
  }

  async enqueue(input: EnqueueSyncInput) {
    return enqueueSync(null, input)
  }

  async listPending(limit = 100) {
    return this.db.syncQueue.findMany({
      where: { status: { in: ['PENDING', 'FAILED'] } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  async countPending() {
    return this.db.syncQueue.count({
      where: { status: { in: ['PENDING', 'FAILED', 'IN_PROGRESS'] } },
    })
  }

  async markSynced(id: string) {
    return this.db.syncQueue.update({
      where: { id },
      data: { status: 'SYNCED', syncedAt: new Date(), lastError: null },
    })
  }

  async markFailed(id: string, error: string) {
    return this.db.syncQueue.update({
      where: { id },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
        lastError: error.slice(0, 2000),
      },
    })
  }

  async markInProgress(ids: string[]) {
    if (ids.length === 0) return
    await this.db.syncQueue.updateMany({
      where: { id: { in: ids } },
      data: { status: 'IN_PROGRESS' },
    })
  }
}
