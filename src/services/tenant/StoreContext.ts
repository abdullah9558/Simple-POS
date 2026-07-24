import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID } from './TenantBootstrapService.ts'

/**
 * Process-wide active tenant/store context for the Electron main process.
 * Renderer reads/writes this via IPC (`store:getActive` / `store:setActive`).
 */
class StoreContextState {
  businessId: string = DEFAULT_BUSINESS_ID
  storeId: string = DEFAULT_STORE_ID

  set(businessId: string, storeId: string) {
    this.businessId = businessId
    this.storeId = storeId
  }

  getActiveStoreId(): string {
    return this.storeId || DEFAULT_STORE_ID
  }

  getActiveBusinessId(): string {
    return this.businessId || DEFAULT_BUSINESS_ID
  }
}

export const storeContext = new StoreContextState()
