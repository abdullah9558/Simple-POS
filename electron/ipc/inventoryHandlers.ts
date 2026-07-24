import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { InventoryService } from '../../src/services/InventoryService.ts'

export function registerInventoryHandlers() {
  const service = new InventoryService()

  ipcMain.handle(IPC.INVENTORY_GET_MOVEMENTS, (_e, filters) => service.getMovements(filters))
  ipcMain.handle(IPC.INVENTORY_PRODUCT_HISTORY, (_e, productId) => service.getProductHistory(productId))
  ipcMain.handle(IPC.INVENTORY_ADJUST, (_e, input) => service.adjustStock(input))
  ipcMain.handle(IPC.INVENTORY_BULK_ADJUST, (_e, inputs) => service.bulkAdjust(inputs))
  ipcMain.handle(IPC.INVENTORY_LOW_STOCK, () => service.getLowStockProducts())
  ipcMain.handle(IPC.INVENTORY_LOW_STOCK_COUNT, () => service.getLowStockCount())
}
