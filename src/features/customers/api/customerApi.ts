import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import { customerSchema, type CustomerFormData } from '../schemas/customerSchema'
import type { PaginatedResult, SortDirection } from '../../../shared/types'

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  creditBalance: number
  outstandingBalance: number
  saleCount: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseHistoryItem {
  id: string
  invoiceNo: string
  total: number
  status: string
  method: string
  itemCount: number
  createdAt: string
}

interface RawCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp?: string | null
  address: string | null
  creditBalance: number
  outstandingBalance: number
  createdAt: string | Date
  updatedAt: string | Date
  sales?: { total: number }[]
  _count?: { sales: number }
}

interface RawSaleHistoryItem {
  id: string
  invoiceNo: string
  total: number
  status: string
  method: string
  createdAt: string | Date
  items: { quantity: number }[]
}

function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

function toCustomer(raw: RawCustomer): Customer {
  const sales = raw.sales ?? []
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    whatsapp: raw.whatsapp ?? null,
    address: raw.address,
    creditBalance: raw.creditBalance,
    outstandingBalance: raw.outstandingBalance,
    saleCount: sales.length,
    totalSpent: sales.reduce((sum, s) => sum + s.total, 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export interface CustomerFilters {
  search?: string
  balanceStatus?: 'all' | 'has-credit' | 'has-outstanding' | 'clear'
}

export type CustomerSortField = 'name' | 'creditBalance' | 'outstandingBalance' | 'totalSpent' | 'saleCount'

export interface CustomerQuery {
  filters?: CustomerFilters
  page?: number
  perPage?: number
  sortField?: CustomerSortField
  sortDir?: SortDirection
}

function matchesBalanceStatus(c: Customer, balanceStatus?: CustomerFilters['balanceStatus']): boolean {
  if (balanceStatus === 'has-credit' && c.creditBalance <= 0) return false
  if (balanceStatus === 'has-outstanding' && c.outstandingBalance <= 0) return false
  if (balanceStatus === 'clear' && (c.creditBalance > 0 || c.outstandingBalance > 0)) return false
  return true
}

export async function fetchCustomers(query: CustomerQuery = {}): Promise<PaginatedResult<Customer>> {
  const { filters = {}, page = 1, perPage = 10, sortField = 'name', sortDir = 'asc' } = query

  if (!isElectron()) {
    return { data: [], total: 0, page: 1, perPage, totalPages: 1 }
  }

  const raw = await ipcInvoke<RawCustomer[]>(IPC.CUSTOMER_GET_ALL, {
    search: filters.search || undefined,
  })

  let customers = raw.map(toCustomer).filter((c) => matchesBalanceStatus(c, filters.balanceStatus))

  const mul = sortDir === 'asc' ? 1 : -1
  customers.sort((a, b) => {
    switch (sortField) {
      case 'name': return mul * a.name.localeCompare(b.name)
      case 'creditBalance': return mul * (a.creditBalance - b.creditBalance)
      case 'outstandingBalance': return mul * (a.outstandingBalance - b.outstandingBalance)
      case 'totalSpent': return mul * (a.totalSpent - b.totalSpent)
      case 'saleCount': return mul * (a.saleCount - b.saleCount)
      default: return 0
    }
  })

  const total = customers.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage

  return { data: customers.slice(start, start + perPage), total, page: safePage, perPage, totalPages }
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const raw = await ipcInvoke<RawCustomer>(IPC.CUSTOMER_GET_BY_ID, id)
  return toCustomer(raw)
}

export async function fetchPurchaseHistory(id: string): Promise<PurchaseHistoryItem[]> {
  const raw = await ipcInvoke<RawSaleHistoryItem[]>(IPC.CUSTOMER_PURCHASE_HISTORY, id)
  return raw.map((s) => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    total: s.total,
    status: s.status,
    method: s.method,
    itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: toIso(s.createdAt),
  }))
}

export async function addCustomer(data: CustomerFormData): Promise<Customer> {
  const parsed = customerSchema.parse(data)
  const raw = await ipcInvoke<RawCustomer>(IPC.CUSTOMER_CREATE, {
    name: parsed.name,
    email: parsed.email || undefined,
    phone: parsed.phone || undefined,
    whatsapp: parsed.whatsapp || undefined,
    address: parsed.address || undefined,
    creditBalance: parsed.creditBalance,
    outstandingBalance: parsed.outstandingBalance,
  })
  return toCustomer(raw)
}

export async function updateCustomer(id: string, data: CustomerFormData): Promise<Customer> {
  const parsed = customerSchema.parse(data)
  const raw = await ipcInvoke<RawCustomer>(IPC.CUSTOMER_UPDATE, id, {
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    whatsapp: parsed.whatsapp || null,
    address: parsed.address || null,
    creditBalance: parsed.creditBalance,
    outstandingBalance: parsed.outstandingBalance,
  })
  return toCustomer(raw)
}

export async function deleteCustomer(id: string): Promise<void> {
  await ipcInvoke<void>(IPC.CUSTOMER_DELETE, id)
}
