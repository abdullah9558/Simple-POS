import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'

export interface SalesPeriodData {
  label: string
  orders: number
  revenue: number
  profit: number
}

export interface ProfitReport {
  revenue: number
  cost: number
  profit: number
  orders: number
  margin: number
}

export interface InventoryReportItem {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  cost: number
  value: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

export interface ProductVelocityItem {
  productId: string
  name: string
  sku: string
  quantitySold: number
  revenue: number
}

export async function fetchDailySales(days = 14): Promise<SalesPeriodData[]> {
  if (!isElectron()) return []
  return ipcInvoke<SalesPeriodData[]>(IPC.REPORT_DAILY_SALES, days)
}

export async function fetchWeeklySales(weeks = 8): Promise<SalesPeriodData[]> {
  if (!isElectron()) return []
  return ipcInvoke<SalesPeriodData[]>(IPC.REPORT_WEEKLY_SALES, weeks)
}

export async function fetchMonthlySales(months = 6): Promise<SalesPeriodData[]> {
  if (!isElectron()) return []
  return ipcInvoke<SalesPeriodData[]>(IPC.REPORT_MONTHLY_SALES, months)
}

export async function fetchProfitReport(days = 30): Promise<ProfitReport> {
  if (!isElectron()) return { revenue: 0, cost: 0, profit: 0, orders: 0, margin: 0 }
  return ipcInvoke<ProfitReport>(IPC.REPORT_PROFIT, days)
}

export async function fetchInventoryReport(): Promise<InventoryReportItem[]> {
  if (!isElectron()) return []
  return ipcInvoke<InventoryReportItem[]>(IPC.REPORT_INVENTORY)
}

export async function fetchFastMovingProducts(limit = 10): Promise<ProductVelocityItem[]> {
  if (!isElectron()) return []
  return ipcInvoke<ProductVelocityItem[]>(IPC.REPORT_FAST_MOVING, limit)
}

export async function fetchSlowMovingProducts(limit = 10): Promise<ProductVelocityItem[]> {
  if (!isElectron()) return []
  return ipcInvoke<ProductVelocityItem[]>(IPC.REPORT_SLOW_MOVING, limit)
}
