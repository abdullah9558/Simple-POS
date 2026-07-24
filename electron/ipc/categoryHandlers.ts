import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { CategoryService } from '../../src/services/CategoryService.ts'

export function registerCategoryHandlers() {
  const service = new CategoryService()

  ipcMain.handle(IPC.CATEGORY_GET_ALL, (_e, filters) => service.getAll(filters))
  ipcMain.handle(IPC.CATEGORY_GET_BY_ID, (_e, id) => service.getById(id))
  ipcMain.handle(IPC.CATEGORY_CREATE, (_e, input) => service.create(input))
  ipcMain.handle(IPC.CATEGORY_UPDATE, (_e, id, input) => service.update(id, input))
  ipcMain.handle(IPC.CATEGORY_DELETE, (_e, id) => service.delete(id))
  ipcMain.handle(IPC.CATEGORY_COUNT, (_e, filters) => service.count(filters))
}
