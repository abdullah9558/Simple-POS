import { getPrisma } from '../prisma.ts'

export interface SalesPeriodReport {
  label: string
  orders: number
  revenue: number
  profit: number
}

export interface ProductVelocityItem {
  productId: string
  name: string
  sku: string
  quantitySold: number
  revenue: number
}

export interface InventoryReportItem {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  cost: number
  value: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

export class ReportRepository {
  private get db() {
    return getPrisma()
  }

  async getSalesByPeriod(period: 'day' | 'week' | 'month', days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const sales = await this.db.sale.findMany({
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    })

    const buckets = new Map<string, { orders: number; revenue: number; profit: number }>()

    for (const sale of sales) {
      const date = new Date(sale.createdAt)
      let key: string

      if (period === 'day') {
        key = date.toISOString().slice(0, 10)
      } else if (period === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().slice(0, 10)
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const bucket = buckets.get(key) ?? { orders: 0, revenue: 0, profit: 0 }
      bucket.orders += 1
      bucket.revenue += sale.total

      for (const item of sale.items) {
        bucket.profit += (item.price - item.product.cost) * item.quantity
      }

      buckets.set(key, bucket)
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, data]) => ({ label, ...data }))
  }

  async getProfitReport(days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const sales = await this.db.sale.findMany({
      where: { createdAt: { gte: since }, status: 'COMPLETED' },
      include: { items: { include: { product: true } } },
    })

    let revenue = 0
    let cost = 0
    let orders = sales.length

    for (const sale of sales) {
      revenue += sale.total
      for (const item of sale.items) {
        cost += item.product.cost * item.quantity
      }
    }

    return { revenue, cost, profit: revenue - cost, orders, margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0 }
  }

  async getInventoryReport() {
    const products = await this.db.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
      cost: p.cost,
      value: p.stock * p.cost,
      status: p.stock === 0 ? 'out-of-stock' as const : p.stock < p.minStock ? 'low-stock' as const : 'in-stock' as const,
    }))
  }

  async getProductVelocity(limit = 10) {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const items = await this.db.saleItem.findMany({
      where: { sale: { createdAt: { gte: since }, status: 'COMPLETED' } },
      include: { product: true },
    })

    const map = new Map<string, ProductVelocityItem>()

    for (const item of items) {
      const existing = map.get(item.productId)
      if (existing) {
        existing.quantitySold += item.quantity
        existing.revenue += item.total
      } else {
        map.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          sku: item.product.sku,
          quantitySold: item.quantity,
          revenue: item.total,
        })
      }
    }

    const sorted = Array.from(map.values()).sort((a, b) => b.quantitySold - a.quantitySold)
    return { fast: sorted.slice(0, limit), slow: [...sorted].reverse().slice(0, limit) }
  }
}
