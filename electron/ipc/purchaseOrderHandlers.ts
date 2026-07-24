import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { PurchaseOrderService } from '../../src/services/PurchaseOrderService.ts'

export function registerPurchaseOrderHandlers() {
  const service = new PurchaseOrderService()

  ipcMain.handle(IPC.PURCHASE_ORDER_GET_ALL, (_e, filters) => service.getAll(filters))
  ipcMain.handle(IPC.PURCHASE_ORDER_GET_BY_ID, (_e, id) => service.getById(id))
  ipcMain.handle(IPC.PURCHASE_ORDER_CREATE, (_e, input) => service.create(input))
  ipcMain.handle(IPC.PURCHASE_ORDER_RECEIVE, (_e, input) => service.receiveStock(input))
  ipcMain.handle(IPC.PURCHASE_ORDER_CANCEL, (_e, id) => service.cancel(id))
  ipcMain.handle(IPC.PURCHASE_ORDER_COUNT, (_e, filters) => service.count(filters))
}
