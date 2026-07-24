import { getPrisma } from '../prisma.ts'
import type { Prisma } from '../../generated/prisma/client.ts'

export interface ProductFilters {
  search?: string
  categoryId?: string
  supplierId?: string
  isActive?: boolean
  lowStock?: boolean
}

export class ProductRepository {
  private get db() {
    return getPrisma()
  }

  async findAll(filters: ProductFilters = {}) {
    const where: Prisma.ProductWhereInput = {}

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { barcode: { contains: filters.search } },
      ]
    }
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.supplierId) where.supplierId = filters.supplierId
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.lowStock) {
      const products = await this.db.product.findMany({
        where,
        include: { category: true, supplier: true },
        orderBy: { name: 'asc' },
      })
      return products.filter((p) => p.stock <= p.minStock)
    }

    return this.db.product.findMany({
      where,
      include: { category: true, supplier: true },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return this.db.product.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    })
  }

  async findBySku(sku: string) {
    return this.db.product.findUnique({
      where: { sku },
      include: { category: true },
    })
  }

  async findByBarcode(barcode: string) {
    return this.db.product.findUnique({
      where: { barcode },
      include: { category: true },
    })
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.db.product.create({
      data,
      include: { category: true, supplier: true },
    })
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.db.product.update({
      where: { id },
      data,
      include: { category: true, supplier: true },
    })
  }

  async delete(id: string) {
    return this.db.product.delete({ where: { id } })
  }

  async updateStock(id: string, quantity: number) {
    return this.db.product.update({
      where: { id },
      data: { stock: { increment: quantity } },
    })
  }

  async getLowStock() {
    return this.db.$queryRaw`
      SELECT p.*, c.name as categoryName
      FROM Product p
      LEFT JOIN Category c ON p.categoryId = c.id
      WHERE p.stock <= p.minStock AND p.isActive = true
      ORDER BY p.stock ASC
    `
  }

  async count(filters: ProductFilters = {}) {
    const where: Prisma.ProductWhereInput = {}
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    return this.db.product.count({ where })
  }
}
