import { registerProductHandlers } from './productHandlers.ts'
import { registerSaleHandlers } from './saleHandlers.ts'
import { registerCustomerHandlers } from './customerHandlers.ts'
import { registerInventoryHandlers } from './inventoryHandlers.ts'
import { registerSupplierHandlers } from './supplierHandlers.ts'
import { registerPurchaseOrderHandlers } from './purchaseOrderHandlers.ts'
import { registerReportHandlers } from './reportHandlers.ts'
import { registerUserHandlers } from './userHandlers.ts'
import { registerDatabaseHandlers } from './databaseHandlers.ts'
import { registerSettingsHandlers } from './settingsHandlers.ts'
import { registerPrintHandlers } from './printHandlers.ts'
import { registerCategoryHandlers } from './categoryHandlers.ts'
import { registerInvoiceHandlers } from './invoiceHandlers.ts'
import { registerStoreHandlers } from './storeHandlers.ts'

export function registerAllIpcHandlers() {
  registerProductHandlers()
  registerSaleHandlers()
  registerCustomerHandlers()
  registerInventoryHandlers()
  registerSupplierHandlers()
  registerPurchaseOrderHandlers()
  registerReportHandlers()
  registerUserHandlers()
  registerDatabaseHandlers()
  registerSettingsHandlers()
  registerPrintHandlers()
  registerCategoryHandlers()
  registerInvoiceHandlers()
  registerStoreHandlers()
}
