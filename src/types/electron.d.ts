import type { IpcChannel } from '../shared/ipcChannels'

export interface ElectronAPI {
  versions: {
    node: () => string
    chrome: () => string
    electron: () => string
  }
  invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>
  on: (channel: IpcChannel, callback: (...args: unknown[]) => void) => () => void
}

export interface ProductFilters {
  search?: string
  categoryId?: string
  supplierId?: string
  isActive?: boolean
  lowStock?: boolean
}

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
  barcode?: string
  price?: number
  cost?: number
  minStock?: number
  categoryId?: string | null
  supplierId?: string | null
  isActive?: boolean
}

export interface SaleItemInput {
  productId: string
  quantity: number
}

export interface CreateSaleOptions {
  customerId?: string
  userId?: string
  method?: 'CASH' | 'CARD' | 'MOBILE'
  discount?: number
  taxRate?: number
  note?: string
  items: SaleItemInput[]
}

export interface SaleFilters {
  search?: string
  status?: string
  method?: string
  customerId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export interface CreateCustomerInput {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface UpdateCustomerInput {
  name?: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface CustomerFilters {
  search?: string
}

export interface StockAdjustmentInput {
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  reason?: string
  reference?: string
}

export interface InventoryFilters {
  productId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
}

export interface AppSettings {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  storeLogo: string
  currency: string
  taxRate: string
  taxEnabled: string
  receiptFooter: string
  receiptPaperWidth: string
  receiptAutoPrint: string
  receiptPrinterName: string
  receiptPrintMode: string
  theme: string
  lowStockThreshold: string
  authSessionTimeout: string
  authMinPasswordLength: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
