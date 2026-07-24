import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import { formatCurrency } from '../../../lib/format'
import { fetchSettings } from '../../settings/api/settingsApi'

export interface DashboardStat {
  label: string
  value: string
  change: number
  icon: 'sales' | 'orders' | 'profit' | 'stock'
}

export interface RecentSale {
  id: string
  customer: string
  items: number
  total: number
  method: 'Cash' | 'Card' | 'Mobile'
  time: string
  status: 'completed' | 'refunded' | 'pending'
}

interface TodaySummary {
  totalSales: number
  totalOrders: number
  totalProfit: number
}

interface RawSale {
  id: string
  invoiceNo: string
  customer?: { name: string } | null
  total: number
  method: 'CASH' | 'CARD' | 'MOBILE'
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED'
  createdAt: string | Date
  items: { quantity: number }[]
}

function formatRelativeTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

const METHOD_LABEL: Record<RawSale['method'], RecentSale['method']> = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE: 'Mobile',
}

const STATUS_LABEL: Record<RawSale['status'], RecentSale['status']> = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
}

export async function fetchDashboardStats(): Promise<DashboardStat[]> {
  if (!isElectron()) return []

  const [summary, lowStockCount, settings] = await Promise.all([
    ipcInvoke<TodaySummary>(IPC.SALE_TODAY_SUMMARY),
    ipcInvoke<number>(IPC.INVENTORY_LOW_STOCK_COUNT),
    fetchSettings().catch(() => null),
  ])

  const currency = settings?.currency || 'USD'

  return [
    { label: "Today's Sales", value: formatCurrency(summary.totalSales, currency), change: 0, icon: 'sales' },
    { label: 'Orders', value: String(summary.totalOrders), change: 0, icon: 'orders' },
    { label: 'Profit', value: formatCurrency(summary.totalProfit, currency), change: 0, icon: 'profit' },
    { label: 'Low Stock', value: String(lowStockCount), change: 0, icon: 'stock' },
  ]
}

export async function fetchRecentSales(limit = 8): Promise<RecentSale[]> {
  if (!isElectron()) return []

  const raw = await ipcInvoke<RawSale[]>(IPC.SALE_GET_ALL, {})
  const sorted = [...raw].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return sorted.slice(0, limit).map((sale) => ({
    id: sale.invoiceNo,
    customer: sale.customer?.name ?? 'Walk-in',
    items: sale.items.reduce((sum, i) => sum + i.quantity, 0),
    total: sale.total,
    method: METHOD_LABEL[sale.method],
    time: formatRelativeTime(sale.createdAt),
    status: STATUS_LABEL[sale.status],
  }))
}
