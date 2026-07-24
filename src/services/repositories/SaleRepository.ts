import { getPrisma, type TransactionClient } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'
import { adjustStoreInventoryQty, resolveStoreId } from './storeInventoryHelpers.ts'
import { enqueueSync } from '../sync/SyncQueueService.ts'

export interface SaleFilters {
  search?: string
  status?: string
  method?: string
  customerId?: string
  userId?: string
  storeId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface CreateSaleInput {
  invoiceNo: string
  storeId?: string
  customerId?: string
  userId?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  method: 'CASH' | 'CARD' | 'MOBILE'
  note?: string
  items: {
    productId: string
    quantity: number
    price: number
    total: number
  }[]
}

export class SaleRepository {
  private get db() {
    return getPrisma()
  }

  async findAll(filters: SaleFilters = {}) {
    const where: Prisma.SaleWhereInput = {}

    if (filters.search) {
      where.OR = [
        { invoiceNo: { contains: filters.search } },
        { customer: { name: { contains: filters.search } } },
        { items: { some: { product: { name: { contains: filters.search } } } } },
      ]
    }
    if (filters.status) where.status = filters.status as Prisma.EnumSaleStatusFilter
    if (filters.method) where.method = filters.method as Prisma.EnumPaymentMethodFilter
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.userId) where.userId = filters.userId
    if (filters.storeId) where.storeId = filters.storeId
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    return this.db.sale.findMany({
      where,
      include: {
        customer: true,
        user: true,
        store: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return this.db.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        store: true,
        items: { include: { product: true } },
      },
    })
  }

  async create(input: CreateSaleInput) {
    const { items, ...saleData } = input
    const storeId = resolveStoreId(input.storeId)

    return this.db.$transaction(async (tx: TransactionClient) => {
      const sale = await tx.sale.create({
        data: {
          ...saleData,
          storeId,
          items: { create: items },
        },
        include: {
          customer: true,
          user: true,
          store: true,
          items: { include: { product: true } },
        },
      })

      for (const item of items) {
        await adjustStoreInventoryQty(tx, storeId, item.productId, -item.quantity)

        await tx.inventoryMovement.create({
          data: {
            storeId,
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'Sale completed',
            reference: sale.invoiceNo,
          },
        })
      }

      await enqueueSync(tx, {
        entityType: 'Sale',
        entityId: sale.id,
        operation: 'CREATE',
        payload: { id: sale.id, invoiceNo: sale.invoiceNo, storeId, total: sale.total },
      })

      return sale
    })
  }

  async updateStatus(id: string, status: 'COMPLETED' | 'PENDING' | 'REFUNDED') {
    return this.db.sale.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } },
    })
  }

  async refund(id: string) {
    return this.db.$transaction(async (tx: TransactionClient) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!sale) throw new Error('Sale not found')
      const storeId = resolveStoreId(sale.storeId)

      for (const item of sale.items) {
        await adjustStoreInventoryQty(tx, storeId, item.productId, item.quantity, { allowCreate: true })

        await tx.inventoryMovement.create({
          data: {
            storeId,
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            reason: 'Sale refund',
            reference: sale.invoiceNo,
          },
        })
      }

      const updated = await tx.sale.update({
        where: { id },
        data: { status: 'REFUNDED' },
        include: { customer: true, items: { include: { product: true } } },
      })

      await enqueueSync(tx, {
        entityType: 'Sale',
        entityId: id,
        operation: 'UPDATE',
        payload: { id, status: 'REFUNDED', storeId },
      })

      return updated
    })
  }

  async getTodaySummary(storeId?: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const activeStoreId = storeId || resolveStoreId()

    const sales = await this.db.sale.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: 'COMPLETED',
        storeId: activeStoreId,
      },
      include: {
        items: { include: { product: { select: { cost: true } } } },
      },
    })

    return {
      totalSales: sales.reduce((sum: number, s) => sum + s.total, 0),
      totalOrders: sales.length,
      totalProfit: sales.reduce((sum: number, sale) => {
        const cost = sale.items.reduce(
          (itemSum: number, item) => itemSum + item.product.cost * item.quantity,
          0,
        )
        return sum + sale.subtotal - sale.discount - cost
      }, 0),
    }
  }

  async getNextInvoiceNo() {
    const invoices = await this.db.sale.findMany({
      where: { invoiceNo: { startsWith: 'INV-' } },
      select: { invoiceNo: true },
    })

    const highest = invoices.reduce((max, sale) => {
      const match = /^INV-(\d+)$/.exec(sale.invoiceNo)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0)
    return `INV-${String(highest + 1).padStart(4, '0')}`
  }

  async count(filters: SaleFilters = {}) {
    const where: Prisma.SaleWhereInput = {}
    if (filters.status) where.status = filters.status as Prisma.EnumSaleStatusFilter
    if (filters.storeId) where.storeId = filters.storeId
    return this.db.sale.count({ where })
  }
}
