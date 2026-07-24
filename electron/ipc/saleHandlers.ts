import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { SaleService } from '../../src/services/SaleService.ts'
import { parseIpcArg, idSchema } from '../../src/shared/ipcValidation.ts'
import { createSaleIpcSchema } from '../../src/shared/ipcSchemas.ts'
import { z } from 'zod'
import type { SaleFilters } from '../../src/services/repositories/index.ts'

const saleFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  method: z.string().optional(),
  customerId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.union([z.string(), z.date()]).optional(),
  dateTo: z.union([z.string(), z.date()]).optional(),
}).optional()

function toSaleFilters(raw: z.infer<typeof saleFiltersSchema>): SaleFilters | undefined {
  if (!raw) return undefined
  return {
    search: raw.search,
    status: raw.status,
    method: raw.method,
    customerId: raw.customerId,
    userId: raw.userId,
    dateFrom: raw.dateFrom ? new Date(raw.dateFrom) : undefined,
    dateTo: raw.dateTo ? new Date(raw.dateTo) : undefined,
  }
}

export function registerSaleHandlers() {
  const service = new SaleService()

  ipcMain.handle(IPC.SALE_GET_ALL, (_e, filters) =>
    service.getAll(toSaleFilters(parseIpcArg(saleFiltersSchema, filters, 'filters'))),
  )
  ipcMain.handle(IPC.SALE_GET_BY_ID, (_e, id) =>
    service.getById(parseIpcArg(idSchema, id, 'id')),
  )
  ipcMain.handle(IPC.SALE_CREATE, (_e, options) =>
    service.create(parseIpcArg(createSaleIpcSchema, options, 'options')),
  )
  ipcMain.handle(IPC.SALE_REFUND, (_e, id) =>
    service.refund(parseIpcArg(idSchema, id, 'id')),
  )
  ipcMain.handle(IPC.SALE_TODAY_SUMMARY, () => service.getTodaySummary())
  ipcMain.handle(IPC.SALE_COUNT, (_e, filters) =>
    service.count(toSaleFilters(parseIpcArg(saleFiltersSchema, filters, 'filters'))),
  )
}
