import { getPrisma } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'

export interface CustomerFilters {
  search?: string
  balanceStatus?: 'all' | 'has-credit' | 'has-outstanding' | 'clear'
}

export class CustomerRepository {
  private get db() {
    return getPrisma()
  }

  private buildWhere(filters: CustomerFilters = {}): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {}

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { whatsapp: { contains: filters.search } },
      ]
    }

    if (filters.balanceStatus === 'has-credit') where.creditBalance = { gt: 0 }
    if (filters.balanceStatus === 'has-outstanding') where.outstandingBalance = { gt: 0 }
    if (filters.balanceStatus === 'clear') {
      where.creditBalance = 0
      where.outstandingBalance = 0
    }

    return where
  }

  async findAll(filters: CustomerFilters = {}) {
    return this.db.customer.findMany({
      where: this.buildWhere(filters),
      include: {
        _count: { select: { sales: true } },
        sales: {
          where: { status: { not: 'REFUNDED' } },
          select: { total: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return this.db.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } },
        },
        _count: { select: { sales: true } },
      },
    })
  }

  async findByEmail(email: string) {
    return this.db.customer.findFirst({ where: { email } })
  }

  async findByPhone(phone: string) {
    return this.db.customer.findFirst({ where: { phone } })
  }

  async findByWhatsapp(whatsapp: string) {
    return this.db.customer.findFirst({ where: { whatsapp } })
  }

  async getPurchaseHistory(customerId: string) {
    return this.db.sale.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: Prisma.CustomerCreateInput) {
    return this.db.customer.create({ data })
  }

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.db.customer.update({ where: { id }, data })
  }

  async updateBalances(id: string, creditBalance: number, outstandingBalance: number) {
    return this.db.customer.update({
      where: { id },
      data: { creditBalance, outstandingBalance },
    })
  }

  async delete(id: string) {
    return this.db.customer.delete({ where: { id } })
  }

  async count(filters: CustomerFilters = {}) {
    return this.db.customer.count({ where: this.buildWhere(filters) })
  }
}
