import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { CustomerService } from '../../src/services/CustomerService.ts'

export function registerCustomerHandlers() {
  const service = new CustomerService()

  ipcMain.handle(IPC.CUSTOMER_GET_ALL, (_e, filters) => service.getAll(filters))
  ipcMain.handle(IPC.CUSTOMER_GET_BY_ID, (_e, id) => service.getById(id))
  ipcMain.handle(IPC.CUSTOMER_CREATE, (_e, input) => service.create(input))
  ipcMain.handle(IPC.CUSTOMER_UPDATE, (_e, id, input) => service.update(id, input))
  ipcMain.handle(IPC.CUSTOMER_DELETE, (_e, id) => service.delete(id))
  ipcMain.handle(IPC.CUSTOMER_COUNT, (_e, filters) => service.count(filters))
  ipcMain.handle(IPC.CUSTOMER_PURCHASE_HISTORY, (_e, id) => service.getPurchaseHistory(id))
}
