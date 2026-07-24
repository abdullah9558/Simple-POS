import { ipcMain } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { ReportService } from '../../src/services/ReportService.ts'

export function registerReportHandlers() {
  const service = new ReportService()

  ipcMain.handle(IPC.REPORT_DAILY_SALES, (_e, days) => service.getDailySales(days))
  ipcMain.handle(IPC.REPORT_WEEKLY_SALES, (_e, weeks) => service.getWeeklySales(weeks))
  ipcMain.handle(IPC.REPORT_MONTHLY_SALES, (_e, months) => service.getMonthlySales(months))
  ipcMain.handle(IPC.REPORT_PROFIT, (_e, days) => service.getProfitReport(days))
  ipcMain.handle(IPC.REPORT_INVENTORY, () => service.getInventoryReport())
  ipcMain.handle(IPC.REPORT_FAST_MOVING, (_e, limit) => service.getFastMovingProducts(limit))
  ipcMain.handle(IPC.REPORT_SLOW_MOVING, (_e, limit) => service.getSlowMovingProducts(limit))
}
