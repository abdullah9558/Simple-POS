import { getPrisma } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'

export interface CategoryFilters {
  search?: string
}

export class CategoryRepository {
  private get db() {
    return getPrisma()
  }

  private buildWhere(filters: CategoryFilters = {}): Prisma.CategoryWhereInput {
    const where: Prisma.CategoryWhereInput = {}

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ]
    }

    return where
  }

  async findAll(filters: CategoryFilters = {}) {
    return this.db.category.findMany({
      where: this.buildWhere(filters),
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return this.db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
  }

  async findByName(name: string) {
    return this.db.category.findUnique({ where: { name } })
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.db.category.create({
      data,
      include: { _count: { select: { products: true } } },
    })
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.db.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    })
  }

  async delete(id: string) {
    return this.db.category.delete({ where: { id } })
  }

  async count(filters: CategoryFilters = {}) {
    return this.db.category.count({ where: this.buildWhere(filters) })
  }
}
