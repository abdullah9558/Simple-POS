import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import type { PaginatedResult, SortDirection } from '../../../shared/types'

export type SaleStatus = 'COMPLETED' | 'PENDING' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE'

export interface SaleItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  price: number
  total: number
}

export interface Sale {
  id: string
  invoiceNo: string
  customerName: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  method: PaymentMethod
  status: SaleStatus
  note: string | null
  itemCount: number
  items: SaleItem[]
  createdAt: string
}

interface RawSaleItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
  product?: { name: string; sku: string } | null
}

interface RawSale {
  id: string
  invoiceNo: string
  customer?: { name: string } | null
  subtotal: number
  tax: number
  discount: number
  total: number
  method: PaymentMethod
  status: SaleStatus
  note: string | null
  createdAt: string | Date
  items: RawSaleItem[]
}

function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

function toSale(raw: RawSale): Sale {
  const items: SaleItem[] = raw.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.product?.name ?? '',
    sku: i.product?.sku ?? '',
    quantity: i.quantity,
    price: i.price,
    total: i.total,
  }))

  return {
    id: raw.id,
    invoiceNo: raw.invoiceNo,
    customerName: raw.customer?.name ?? null,
    subtotal: raw.subtotal,
    tax: raw.tax,
    discount: raw.discount,
    total: raw.total,
    method: raw.method,
    status: raw.status,
    note: raw.note,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
    createdAt: toIso(raw.createdAt),
  }
}

export interface SaleFilters {
  search?: string
  status?: 'all' | 'COMPLETED' | 'PENDING' | 'REFUNDED'
  method?: 'all' | 'CASH' | 'CARD' | 'MOBILE'
  dateFrom?: string
  dateTo?: string
}

export type SaleSortField = 'invoiceNo' | 'total' | 'method' | 'status' | 'createdAt'

export interface SaleQuery {
  filters?: SaleFilters
  page?: number
  perPage?: number
  sortField?: SaleSortField
  sortDir?: SortDirection
}

function sortSales(sales: Sale[], field: SaleSortField, dir: SortDirection): Sale[] {
  const sorted = [...sales]
  const mul = dir === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    switch (field) {
      case 'invoiceNo': return mul * a.invoiceNo.localeCompare(b.invoiceNo)
      case 'total': return mul * (a.total - b.total)
      case 'method': return mul * a.method.localeCompare(b.method)
      case 'status': return mul * a.status.localeCompare(b.status)
      case 'createdAt': return mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      default: return 0
    }
  })
  return sorted
}

export async function fetchSales(query: SaleQuery = {}): Promise<PaginatedResult<Sale>> {
  const { filters = {}, page = 1, perPage = 10, sortField = 'createdAt', sortDir = 'desc' } = query

  if (!isElectron()) {
    return { data: [], total: 0, page: 1, perPage, totalPages: 1 }
  }

  const raw = await ipcInvoke<RawSale[]>(IPC.SALE_GET_ALL, {
    search: filters.search || undefined,
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    method: filters.method && filters.method !== 'all' ? filters.method : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  })

  let sales = raw.map(toSale)
  sales = sortSales(sales, sortField, sortDir)

  const total = sales.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage

  return { data: sales.slice(start, start + perPage), total, page: safePage, perPage, totalPages }
}

export async function fetchSaleById(id: string): Promise<Sale> {
  const raw = await ipcInvoke<RawSale>(IPC.SALE_GET_BY_ID, id)
  return toSale(raw)
}

export async function refundSale(id: string): Promise<Sale> {
  const raw = await ipcInvoke<RawSale>(IPC.SALE_REFUND, id)
  return toSale(raw)
}
