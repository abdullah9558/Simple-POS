import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { ProductService } from '../../src/services/ProductService.ts'
import { parseIpcArg, idSchema } from '../../src/shared/ipcValidation.ts'
import {
  createProductIpcSchema,
  productFiltersSchema,
  updateProductIpcSchema,
} from '../../src/shared/ipcSchemas.ts'

export function registerProductHandlers() {
  const service = new ProductService()

  ipcMain.handle(IPC.PRODUCT_GET_ALL, (_e, filters) =>
    service.getAll(parseIpcArg(productFiltersSchema, filters, 'filters')),
  )
  ipcMain.handle(IPC.PRODUCT_GET_BY_ID, (_e, id) =>
    service.getById(parseIpcArg(idSchema, id, 'id')),
  )
  ipcMain.handle(IPC.PRODUCT_GET_BY_BARCODE, (_e, barcode) =>
    service.getByBarcode(parseIpcArg(z.string().min(1).max(64), barcode, 'barcode')),
  )
  ipcMain.handle(IPC.PRODUCT_CREATE, (_e, input) =>
    service.create(parseIpcArg(createProductIpcSchema, input, 'input')),
  )
  ipcMain.handle(IPC.PRODUCT_UPDATE, (_e, id, input) =>
    service.update(
      parseIpcArg(idSchema, id, 'id'),
      parseIpcArg(updateProductIpcSchema, input, 'input'),
    ),
  )
  ipcMain.handle(IPC.PRODUCT_DELETE, (_e, id) =>
    service.delete(parseIpcArg(idSchema, id, 'id')),
  )
  ipcMain.handle(IPC.PRODUCT_LOW_STOCK, () => service.getLowStock())
  ipcMain.handle(IPC.PRODUCT_COUNT, (_e, filters) =>
    service.count(parseIpcArg(productFiltersSchema, filters, 'filters')),
  )
}
