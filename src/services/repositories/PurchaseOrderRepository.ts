import { getPrisma, type TransactionClient } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'
import { adjustStoreInventoryQty, resolveStoreId } from './storeInventoryHelpers.ts'
import { enqueueSync } from '../sync/SyncQueueService.ts'

export interface PurchaseOrderFilters {
  search?: string
  status?: string
  supplierId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface CreatePurchaseOrderInput {
  supplierId: string
  note?: string
  items: { productId: string; quantity: number; cost: number }[]
}

export interface ReceiveStockInput {
  purchaseOrderId: string
  items: { itemId: string; quantity: number }[]
}

export class PurchaseOrderRepository {
  private get db() {
    return getPrisma()
  }

  async findAll(filters: PurchaseOrderFilters = {}) {
    const where: Prisma.PurchaseOrderWhereInput = {}

    if (filters.search) {
      where.OR = [
        { orderNo: { contains: filters.search } },
        { supplier: { name: { contains: filters.search } } },
      ]
    }
    if (filters.status) where.status = filters.status as Prisma.EnumPurchaseOrderStatusFilter
    if (filters.supplierId) where.supplierId = filters.supplierId
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    return this.db.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return this.db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    })
  }

  async create(input: CreatePurchaseOrderInput) {
    const totalCost = input.items.reduce((sum, i) => sum + i.quantity * i.cost, 0)
    const orderNo = await this.getNextOrderNo()
    const storeId = resolveStoreId()

    const order = await this.db.purchaseOrder.create({
      data: {
        orderNo,
        storeId,
        supplierId: input.supplierId,
        note: input.note,
        totalCost,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            cost: i.cost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    })

    await enqueueSync(null, {
      entityType: 'PurchaseOrder',
      entityId: order.id,
      operation: 'CREATE',
      payload: { id: order.id, orderNo, storeId },
    })

    return order
  }

  async receiveStock(input: ReceiveStockInput) {
    return this.db.$transaction(async (tx: TransactionClient) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: { items: true },
      })

      if (!order) throw new Error('Purchase order not found')
      if (order.status === 'CANCELLED') throw new Error('Cannot receive stock for cancelled order')
      if (order.status === 'RECEIVED') throw new Error('Purchase order already fully received')

      const storeId = resolveStoreId(order.storeId)

      for (const receiveItem of input.items) {
        const poItem = order.items.find((i) => i.id === receiveItem.itemId)
        if (!poItem) throw new Error(`PO item not found: ${receiveItem.itemId}`)

        const remaining = poItem.quantity - poItem.receivedQty
        if (receiveItem.quantity > remaining) {
          throw new Error(`Cannot receive ${receiveItem.quantity} — only ${remaining} remaining`)
        }

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: { increment: receiveItem.quantity } },
        })

        await adjustStoreInventoryQty(tx, storeId, poItem.productId, receiveItem.quantity, {
          allowCreate: true,
        })

        await tx.inventoryMovement.create({
          data: {
            storeId,
            productId: poItem.productId,
            type: 'IN',
            quantity: receiveItem.quantity,
            reason: 'Purchase order received',
            reference: order.orderNo,
          },
        })
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
      })

      const allReceived = updatedItems.every((i) => i.receivedQty >= i.quantity)
      const anyReceived = updatedItems.some((i) => i.receivedQty > 0)

      const status = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : 'PENDING'

      const updated = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status,
          receivedAt: allReceived ? new Date() : order.receivedAt,
        },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      })

      await enqueueSync(tx, {
        entityType: 'PurchaseOrder',
        entityId: order.id,
        operation: 'UPDATE',
        payload: { id: order.id, status, storeId },
      })

      return updated
    })
  }

  async cancel(id: string) {
    const order = await this.findById(id)
    if (!order) throw new Error('Purchase order not found')
    if (order.status === 'RECEIVED') throw new Error('Cannot cancel a fully received order')
    if (order.items.some((i) => i.receivedQty > 0)) {
      throw new Error('Cannot cancel order with partial receipts')
    }

    return this.db.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { supplier: true, items: { include: { product: true } } },
    })
  }

  async getNextOrderNo() {
    const last = await this.db.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNo: true },
    })

    if (!last) return 'PO-0001'

    const lastNum = parseInt(last.orderNo.replace('PO-', ''), 10)
    return `PO-${String(lastNum + 1).padStart(4, '0')}`
  }

  async count(filters: PurchaseOrderFilters = {}) {
    const where: Prisma.PurchaseOrderWhereInput = {}
    if (filters.status) where.status = filters.status as Prisma.EnumPurchaseOrderStatusFilter
    if (filters.supplierId) where.supplierId = filters.supplierId
    return this.db.purchaseOrder.count({ where })
  }
}
