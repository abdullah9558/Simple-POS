import { getPrisma } from './prisma.ts'
import { storeContext } from './tenant/StoreContext.ts'
import { refreshProductStockMirrors } from './repositories/storeInventoryHelpers.ts'
import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID } from './tenant/TenantBootstrapService.ts'

export class StoreService {
  private get db() {
    return getPrisma()
  }

  async listForBusiness(businessId?: string) {
    const bid = businessId || storeContext.getActiveBusinessId() || DEFAULT_BUSINESS_ID
    return this.db.store.findMany({
      where: { businessId: bid, isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  async listAll() {
    return this.db.store.findMany({ orderBy: { name: 'asc' } })
  }

  async getById(id: string) {
    const store = await this.db.store.findUnique({ where: { id } })
    if (!store) throw new Error(`Store not found: ${id}`)
    return store
  }

  async getActive() {
    const storeId = storeContext.getActiveStoreId() || DEFAULT_STORE_ID
    return this.getById(storeId)
  }

  async setActiveStore(storeId: string) {
    const store = await this.getById(storeId)
    storeContext.set(store.businessId, store.id)
    await refreshProductStockMirrors(store.id)
    return store
  }

  async create(input: {
    name: string
    code: string
    address?: string
    phone?: string
    email?: string
    businessId?: string
  }) {
    const businessId = input.businessId || storeContext.getActiveBusinessId() || DEFAULT_BUSINESS_ID
    return this.db.store.create({
      data: {
        businessId,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        address: input.address,
        phone: input.phone,
        email: input.email,
        isActive: true,
      },
    })
  }

  async setActiveFlag(id: string, isActive: boolean) {
    return this.db.store.update({ where: { id }, data: { isActive } })
  }
}
