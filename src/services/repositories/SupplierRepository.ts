import { getPrisma } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'

export interface SupplierFilters {
  search?: string
  isActive?: boolean
}

export class SupplierRepository {
  private get db() {
    return getPrisma()
  }

  async findAll(filters: SupplierFilters = {}) {
    const where: Prisma.SupplierWhereInput = {}

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { company: { contains: filters.search } },
      ]
    }
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    return this.db.supplier.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return this.db.supplier.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { products: true } },
      },
    })
  }

  async create(data: Prisma.SupplierCreateInput) {
    return this.db.supplier.create({ data })
  }

  async update(id: string, data: Prisma.SupplierUpdateInput) {
    return this.db.supplier.update({ where: { id }, data })
  }

  async delete(id: string) {
    return this.db.supplier.delete({ where: { id } })
  }

  async count(filters: SupplierFilters = {}) {
    const where: Prisma.SupplierWhereInput = {}
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    return this.db.supplier.count({ where })
  }
}
