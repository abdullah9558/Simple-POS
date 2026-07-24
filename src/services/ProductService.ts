import { ProductRepository, type ProductFilters } from './repositories/index.ts'
import type { Prisma } from '../generated/prisma/client.ts'
import { getPrisma } from './prisma.ts'
import { storeContext } from './tenant/StoreContext.ts'
import { enqueueSync } from './sync/SyncQueueService.ts'

export interface CreateProductInput {
  name: string
  sku: string
  barcode?: string
  price: number
  cost?: number
  stock?: number
  minStock?: number
  categoryId?: string
  supplierId?: string
}

export interface UpdateProductInput {
  name?: string
  sku?: string
  barcode?: string | null
  price?: number
  cost?: number
  minStock?: number
  categoryId?: string | null
  supplierId?: string | null
  isActive?: boolean
}

export class ProductService {
  private repo = new ProductRepository()

  async getAll(filters?: ProductFilters) {
    return this.repo.findAll(filters)
  }

  async getById(id: string) {
    const product = await this.repo.findById(id)
    if (!product) throw new Error(`Product not found: ${id}`)
    return product
  }

  async getByBarcode(barcode: string) {
    const product = await this.repo.findByBarcode(barcode)
    if (!product) throw new Error(`Product not found for barcode: ${barcode}`)
    return product
  }

  async create(input: CreateProductInput) {
    const existing = await this.repo.findBySku(input.sku)
    if (existing) throw new Error(`SKU already exists: ${input.sku}`)

    if (input.barcode) {
      const byBarcode = await this.repo.findByBarcode(input.barcode)
      if (byBarcode) throw new Error(`Barcode already exists: ${input.barcode}`)
    }

    const data: Prisma.ProductCreateInput = {
      name: input.name,
      sku: input.sku,
      barcode: input.barcode,
      price: input.price,
      cost: input.cost ?? 0,
      stock: input.stock ?? 0,
      minStock: input.minStock ?? 5,
      business: { connect: { id: storeContext.getActiveBusinessId() } },
      ...(input.categoryId && { category: { connect: { id: input.categoryId } } }),
      ...(input.supplierId && { supplier: { connect: { id: input.supplierId } } }),
    }

    const product = await this.repo.create(data)
    const storeId = storeContext.getActiveStoreId()
    const qty = input.stock ?? 0
    await getPrisma().storeInventory.create({
      data: {
        storeId,
        productId: product.id,
        quantity: qty,
        minStock: input.minStock ?? 5,
        version: 1,
      },
    })
    await enqueueSync(null, {
      entityType: 'Product',
      entityId: product.id,
      operation: 'CREATE',
      payload: { id: product.id, sku: product.sku, storeId, quantity: qty },
    })
    return product
  }

  async update(id: string, input: UpdateProductInput) {
    await this.getById(id)

    const data: Prisma.ProductUpdateInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.sku !== undefined) data.sku = input.sku
    if (input.barcode !== undefined) data.barcode = input.barcode
    if (input.price !== undefined) data.price = input.price
    if (input.cost !== undefined) data.cost = input.cost
    if (input.minStock !== undefined) data.minStock = input.minStock
    if (input.isActive !== undefined) data.isActive = input.isActive

    if (input.categoryId === null) {
      data.category = { disconnect: true }
    } else if (input.categoryId) {
      data.category = { connect: { id: input.categoryId } }
    }

    if (input.supplierId === null) {
      data.supplier = { disconnect: true }
    } else if (input.supplierId) {
      data.supplier = { connect: { id: input.supplierId } }
    }

    return this.repo.update(id, data)
  }

  async delete(id: string) {
    await this.getById(id)
    return this.repo.delete(id)
  }

  async getLowStock() {
    return this.repo.getLowStock()
  }

  async count(filters?: ProductFilters) {
    return this.repo.count(filters)
  }
}
