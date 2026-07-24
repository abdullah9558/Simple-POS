import { getPrisma, type TransactionClient } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'
import { adjustStoreInventoryQty, resolveStoreId } from './storeInventoryHelpers.ts'
import { enqueueSync } from '../sync/SyncQueueService.ts'

export interface InventoryFilters {
  productId?: string
  type?: string
  storeId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface AdjustStockInput {
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER_OUT' | 'TRANSFER_IN'
  quantity: number
  reason?: string
  reference?: string
  storeId?: string
}

export class InventoryRepository {
  private get db() {
    return getPrisma()
  }

  async findAll(filters: InventoryFilters = {}) {
    const where: Prisma.InventoryMovementWhereInput = {}

    if (filters.productId) where.productId = filters.productId
    if (filters.type) where.type = filters.type as Prisma.EnumMovementTypeFilter
    if (filters.storeId) where.storeId = filters.storeId
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    return this.db.inventoryMovement.findMany({
      where,
      include: { product: true, store: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByProductId(productId: string) {
    return this.db.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async adjustStock(input: AdjustStockInput) {
    const { productId, type, quantity, reason, reference } = input
    const storeId = resolveStoreId(input.storeId)
    const delta = type === 'OUT' || type === 'TRANSFER_OUT' ? -quantity : quantity

    return this.db.$transaction(async (tx: TransactionClient) => {
      await adjustStoreInventoryQty(tx, storeId, productId, delta, { allowCreate: true })

      const movement = await tx.inventoryMovement.create({
        data: { storeId, productId, type, quantity, reason, reference },
        include: { product: true, store: true },
      })

      await enqueueSync(tx, {
        entityType: 'InventoryMovement',
        entityId: movement.id,
        operation: 'CREATE',
        payload: { ...input, storeId, id: movement.id },
      })

      return movement
    })
  }

  async bulkAdjust(inputs: AdjustStockInput[]) {
    return this.db.$transaction(async (tx: TransactionClient) => {
      const movements = []

      for (const input of inputs) {
        const storeId = resolveStoreId(input.storeId)
        const delta = input.type === 'OUT' || input.type === 'TRANSFER_OUT'
          ? -input.quantity
          : input.quantity

        await adjustStoreInventoryQty(tx, storeId, input.productId, delta, { allowCreate: true })

        const movement = await tx.inventoryMovement.create({
          data: {
            storeId,
            productId: input.productId,
            type: input.type,
            quantity: input.quantity,
            reason: input.reason,
            reference: input.reference,
          },
        })

        await enqueueSync(tx, {
          entityType: 'InventoryMovement',
          entityId: movement.id,
          operation: 'CREATE',
          payload: { ...input, storeId, id: movement.id },
        })

        movements.push(movement)
      }

      return movements
    })
  }

  async getLowStockProducts(storeId?: string) {
    const activeStoreId = resolveStoreId(storeId)
    return this.db.$queryRawUnsafe<Array<{
      id: string
      name: string
      sku: string
      stock: number
      minStock: number
      categoryName: string | null
    }>>(
      `SELECT p.id, p.name, p.sku, si.quantity as stock, si.minStock, c.name as categoryName
       FROM StoreInventory si
       JOIN Product p ON p.id = si.productId
       LEFT JOIN Category c ON p.categoryId = c.id
       WHERE si.storeId = ? AND si.quantity <= si.minStock AND p.isActive = 1
       ORDER BY (si.quantity * 1.0 / CASE WHEN si.minStock = 0 THEN 1 ELSE si.minStock END) ASC`,
      activeStoreId,
    )
  }

  async count(filters: InventoryFilters = {}) {
    const where: Prisma.InventoryMovementWhereInput = {}
    if (filters.productId) where.productId = filters.productId
    if (filters.type) where.type = filters.type as Prisma.EnumMovementTypeFilter
    if (filters.storeId) where.storeId = filters.storeId
    return this.db.inventoryMovement.count({ where })
  }
}
