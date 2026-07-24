import { InventoryRepository, type InventoryFilters, type AdjustStockInput } from './repositories/index.ts'
import { ProductRepository } from './repositories/index.ts'

export interface StockAdjustmentInput {
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  reason?: string
  reference?: string
}

export class InventoryService {
  private inventoryRepo = new InventoryRepository()
  private productRepo = new ProductRepository()

  async getMovements(filters?: InventoryFilters) {
    return this.inventoryRepo.findAll(filters)
  }

  async getProductHistory(productId: string) {
    const product = await this.productRepo.findById(productId)
    if (!product) throw new Error(`Product not found: ${productId}`)
    return this.inventoryRepo.findByProductId(productId)
  }

  async adjustStock(input: StockAdjustmentInput) {
    const product = await this.productRepo.findById(input.productId)
    if (!product) throw new Error(`Product not found: ${input.productId}`)

    if (input.type === 'OUT' && product.stock < input.quantity) {
      throw new Error(`Insufficient stock for ${product.name}: available ${product.stock}, requested ${input.quantity}`)
    }

    if (input.quantity <= 0) throw new Error('Quantity must be positive')

    return this.inventoryRepo.adjustStock(input as AdjustStockInput)
  }

  async bulkAdjust(inputs: StockAdjustmentInput[]) {
    if (inputs.length === 0) throw new Error('No adjustments provided')

    for (const input of inputs) {
      const product = await this.productRepo.findById(input.productId)
      if (!product) throw new Error(`Product not found: ${input.productId}`)
      if (input.quantity <= 0) throw new Error(`Invalid quantity for ${product.name}`)
      if (input.type === 'OUT' && product.stock < input.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }
    }

    return this.inventoryRepo.bulkAdjust(inputs as AdjustStockInput[])
  }

  async getLowStockProducts() {
    return this.inventoryRepo.getLowStockProducts()
  }

  async getLowStockCount() {
    const products = await this.inventoryRepo.getLowStockProducts() as unknown[]
    return products.length
  }
}
