import { SupplierRepository, type SupplierFilters } from './repositories/index.ts'
import type { Prisma } from '../generated/prisma/client.ts'

export interface CreateSupplierInput {
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  isActive?: boolean
}

export class SupplierService {
  private repo = new SupplierRepository()

  async getAll(filters?: SupplierFilters) {
    return this.repo.findAll(filters)
  }

  async getById(id: string) {
    const supplier = await this.repo.findById(id)
    if (!supplier) throw new Error(`Supplier not found: ${id}`)
    return supplier
  }

  async create(input: CreateSupplierInput) {
    if (!input.name.trim()) throw new Error('Supplier name is required')
    return this.repo.create(input as Prisma.SupplierCreateInput)
  }

  async update(id: string, input: UpdateSupplierInput) {
    await this.getById(id)
    return this.repo.update(id, input as Prisma.SupplierUpdateInput)
  }

  async delete(id: string) {
    const supplier = await this.getById(id)
    if (supplier._count.products > 0) {
      throw new Error(`Cannot delete supplier with ${supplier._count.products} linked products`)
    }
    return this.repo.delete(id)
  }

  async count(filters?: SupplierFilters) {
    return this.repo.count(filters)
  }
}
