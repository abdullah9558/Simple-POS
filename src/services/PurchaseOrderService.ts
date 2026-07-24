import {
  PurchaseOrderRepository,
  type PurchaseOrderFilters,
  type CreatePurchaseOrderInput,
  type ReceiveStockInput,
} from './repositories/PurchaseOrderRepository.ts'
import { SupplierRepository } from './repositories/index.ts'
import { ProductRepository } from './repositories/index.ts'

export class PurchaseOrderService {
  private poRepo = new PurchaseOrderRepository()
  private supplierRepo = new SupplierRepository()
  private productRepo = new ProductRepository()

  async getAll(filters?: PurchaseOrderFilters) {
    return this.poRepo.findAll(filters)
  }

  async getById(id: string) {
    const order = await this.poRepo.findById(id)
    if (!order) throw new Error(`Purchase order not found: ${id}`)
    return order
  }

  async create(input: CreatePurchaseOrderInput) {
    if (input.items.length === 0) throw new Error('Purchase order must have at least one item')

    const supplier = await this.supplierRepo.findById(input.supplierId)
    if (!supplier) throw new Error(`Supplier not found: ${input.supplierId}`)

    for (const item of input.items) {
      const product = await this.productRepo.findById(item.productId)
      if (!product) throw new Error(`Product not found: ${item.productId}`)
      if (item.quantity <= 0) throw new Error(`Invalid quantity for ${product.name}`)
      if (item.cost < 0) throw new Error(`Invalid cost for ${product.name}`)
    }

    return this.poRepo.create(input)
  }

  async receiveStock(input: ReceiveStockInput) {
    if (input.items.length === 0) throw new Error('No items to receive')

    for (const item of input.items) {
      if (item.quantity <= 0) throw new Error('Receive quantity must be positive')
    }

    return this.poRepo.receiveStock(input)
  }

  async cancel(id: string) {
    return this.poRepo.cancel(id)
  }

  async count(filters?: PurchaseOrderFilters) {
    return this.poRepo.count(filters)
  }
}
