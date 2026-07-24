import { getPrisma } from './prisma.ts'
import { adjustStoreInventoryQty, resolveStoreId } from './repositories/storeInventoryHelpers.ts'
import { enqueueSync } from './sync/SyncQueueService.ts'

export class StockTransferService {
  private get db() {
    return getPrisma()
  }

  async list() {
    return this.db.stockTransfer.findMany({
      include: {
        fromStore: true,
        toStore: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createAndComplete(input: {
    fromStoreId: string
    toStoreId: string
    note?: string
    createdById?: string
    items: { productId: string; quantity: number }[]
  }) {
    if (input.fromStoreId === input.toStoreId) {
      throw new Error('Cannot transfer stock to the same store')
    }
    if (input.items.length === 0) throw new Error('Transfer requires at least one item')

    return this.db.$transaction(async (tx) => {
      const transferNo = await this.nextTransferNo(tx)
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNo,
          fromStoreId: input.fromStoreId,
          toStoreId: input.toStoreId,
          note: input.note,
          createdById: input.createdById,
          status: 'COMPLETED',
          completedAt: new Date(),
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        },
        include: {
          fromStore: true,
          toStore: true,
          items: { include: { product: true } },
        },
      })

      for (const item of input.items) {
        await adjustStoreInventoryQty(tx, input.fromStoreId, item.productId, -item.quantity)
        await adjustStoreInventoryQty(tx, input.toStoreId, item.productId, item.quantity, {
          allowCreate: true,
        })

        await tx.inventoryMovement.create({
          data: {
            storeId: input.fromStoreId,
            productId: item.productId,
            type: 'TRANSFER_OUT',
            quantity: item.quantity,
            reason: 'Stock transfer out',
            reference: transferNo,
          },
        })
        await tx.inventoryMovement.create({
          data: {
            storeId: input.toStoreId,
            productId: item.productId,
            type: 'TRANSFER_IN',
            quantity: item.quantity,
            reason: 'Stock transfer in',
            reference: transferNo,
          },
        })
      }

      // Keep Product.stock mirror aligned with whatever store is currently active.
      const activeStoreId = resolveStoreId()
      if (activeStoreId === input.fromStoreId || activeStoreId === input.toStoreId) {
        for (const item of input.items) {
          const inv = await tx.storeInventory.findUnique({
            where: {
              storeId_productId: { storeId: activeStoreId, productId: item.productId },
            },
          })
          if (inv) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: inv.quantity },
            })
          }
        }
      }

      await enqueueSync(tx, {
        entityType: 'StockTransfer',
        entityId: transfer.id,
        operation: 'CREATE',
        payload: {
          id: transfer.id,
          transferNo,
          fromStoreId: input.fromStoreId,
          toStoreId: input.toStoreId,
          items: input.items,
        },
      })

      await tx.auditLog.create({
        data: {
          storeId: input.fromStoreId,
          userId: input.createdById,
          action: 'STOCK_TRANSFER',
          entityType: 'StockTransfer',
          entityId: transfer.id,
          metadata: JSON.stringify({ transferNo, toStoreId: input.toStoreId }),
        },
      })

      return transfer
    })
  }

  private async nextTransferNo(tx: { stockTransfer: { findFirst: Function } }) {
    const last = await tx.stockTransfer.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transferNo: true },
    })
    if (!last) return 'TR-0001'
    const num = parseInt(String(last.transferNo).replace('TR-', ''), 10) || 0
    return `TR-${String(num + 1).padStart(4, '0')}`
  }
}
