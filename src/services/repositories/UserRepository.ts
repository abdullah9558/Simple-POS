import { getPrisma } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'

export interface UserFilters {
  search?: string
  role?: string
  isActive?: boolean
}

export class UserRepository {
  private get db() {
    return getPrisma()
  }

  async findAll(filters: UserFilters = {}) {
    const where: Prisma.UserWhereInput = {}

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ]
    }
    if (filters.role) where.role = filters.role as Prisma.EnumUserRoleFilter
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    return this.db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sales: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sales: true } },
      },
    })
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } })
  }

  async create(data: { name: string; email: string; password: string; role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' }) {
    return this.db.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sales: true } },
      },
    })
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sales: true } },
      },
    })
  }

  async delete(id: string) {
    return this.db.user.delete({ where: { id } })
  }

  async count() {
    return this.db.user.count()
  }
}
