import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { SupplierService } from '../../src/services/SupplierService.ts'

export function registerSupplierHandlers() {
  const service = new SupplierService()

  ipcMain.handle(IPC.SUPPLIER_GET_ALL, (_e, filters) => service.getAll(filters))
  ipcMain.handle(IPC.SUPPLIER_GET_BY_ID, (_e, id) => service.getById(id))
  ipcMain.handle(IPC.SUPPLIER_CREATE, (_e, input) => service.create(input))
  ipcMain.handle(IPC.SUPPLIER_UPDATE, (_e, id, input) => service.update(id, input))
  ipcMain.handle(IPC.SUPPLIER_DELETE, (_e, id) => service.delete(id))
  ipcMain.handle(IPC.SUPPLIER_COUNT, (_e, filters) => service.count(filters))
}
