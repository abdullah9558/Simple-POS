import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { UserService } from '../../src/services/UserService.ts'
import { parseIpcArg, idSchema } from '../../src/shared/ipcValidation.ts'
import { createUserIpcSchema, updateUserIpcSchema } from '../../src/shared/ipcSchemas.ts'
import { z } from 'zod'

const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
}).optional()

export function registerUserHandlers() {
  const service = new UserService()

  ipcMain.handle(IPC.USER_GET_ALL, (_e, filters) =>
    service.getAll(parseIpcArg(userFiltersSchema, filters, 'filters')),
  )
  ipcMain.handle(IPC.USER_GET_BY_ID, (_e, id) =>
    service.getById(parseIpcArg(idSchema, id, 'id')),
  )
  ipcMain.handle(IPC.USER_CREATE, (_e, input) =>
    service.create(parseIpcArg(createUserIpcSchema, input, 'input')),
  )
  ipcMain.handle(IPC.USER_UPDATE, (_e, id, input) =>
    service.update(
      parseIpcArg(idSchema, id, 'id'),
      parseIpcArg(updateUserIpcSchema, input, 'input'),
    ),
  )
  ipcMain.handle(IPC.USER_DELETE, (_e, id) =>
    service.delete(parseIpcArg(idSchema, id, 'id')),
  )
  ipcMain.handle(IPC.USER_COUNT, () => service.count())
}
