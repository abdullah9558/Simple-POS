import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import { toProduct, type Product, type RawProduct } from '../../products/api/productApi'
import type { PaginatedResult, SortDirection } from '../../../shared/types'
import type { StockAdjustmentFormData, SupplierFormData, PurchaseOrderFormData } from '../schemas/inventorySchema'

function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

// ─── Stock ───────────────────────────────────────────────────────

export interface StockFilters {
  search?: string
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
  categoryId?: string
}

export type StockSortField = 'name' | 'sku' | 'stock' | 'cost'

export interface StockQuery {
  filters?: StockFilters
  page?: number
  perPage?: number
  sortField?: StockSortField
  sortDir?: SortDirection
}

export interface StockSummary {
  totalProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

export async function fetchStockSummary(): Promise<StockSummary> {
  if (!isElectron()) {
    return { totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }
  }

  const raw = await ipcInvoke<RawProduct[]>(IPC.PRODUCT_GET_ALL, { isActive: true })
  const products = raw.map(toProduct)

  const outOfStock = products.filter((p) => p.stock === 0).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < p.minStock).length
  const inStock = products.filter((p) => p.stock >= p.minStock).length
  const totalValue = products.reduce((s, p) => s + p.stock * p.cost, 0)

  return { totalProducts: products.length, inStock, lowStock, outOfStock, totalValue }
}

export async function fetchStock(query: StockQuery = {}): Promise<PaginatedResult<Product>> {
  const { filters = {}, page = 1, perPage = 10, sortField = 'name', sortDir = 'asc' } = query

  if (!isElectron()) {
    return { data: [], total: 0, page: 1, perPage, totalPages: 1 }
  }

  const raw = await ipcInvoke<RawProduct[]>(IPC.PRODUCT_GET_ALL, {
    isActive: true,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
  })

  let products = raw.map(toProduct)

  if (filters.stockStatus === 'out-of-stock') products = products.filter((p) => p.stock === 0)
  if (filters.stockStatus === 'low-stock') products = products.filter((p) => p.stock > 0 && p.stock < p.minStock)
  if (filters.stockStatus === 'in-stock') products = products.filter((p) => p.stock >= p.minStock)

  const mul = sortDir === 'asc' ? 1 : -1
  products.sort((a, b) => {
    switch (sortField) {
      case 'name': return mul * a.name.localeCompare(b.name)
      case 'sku': return mul * a.sku.localeCompare(b.sku)
      case 'stock': return mul * (a.stock - b.stock)
      case 'cost': return mul * (a.cost - b.cost)
      default: return 0
    }
  })

  const total = products.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage

  return { data: products.slice(start, start + perPage), total, page: safePage, perPage, totalPages }
}

// ─── Movements ───────────────────────────────────────────────────

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'

export interface Movement {
  id: string
  productId: string
  productName: string
  sku: string
  type: MovementType
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: string
}

interface RawMovement {
  id: string
  productId: string
  type: MovementType
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: string | Date
  product?: { name: string; sku: string } | null
}

function toMovement(raw: RawMovement): Movement {
  return {
    id: raw.id,
    productId: raw.productId,
    productName: raw.product?.name ?? '',
    sku: raw.product?.sku ?? '',
    type: raw.type,
    quantity: raw.quantity,
    reason: raw.reason,
    reference: raw.reference,
    createdAt: toIso(raw.createdAt),
  }
}

export interface MovementFilters {
  search?: string
  type?: 'all' | 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  productId?: string
}

export async function fetchMovements(
  query: { filters?: MovementFilters; page?: number; perPage?: number } = {},
): Promise<PaginatedResult<Movement>> {
  const { filters = {}, page = 1, perPage = 10 } = query

  if (!isElectron()) {
    return { data: [], total: 0, page: 1, perPage, totalPages: 1 }
  }

  const raw = await ipcInvoke<RawMovement[]>(IPC.INVENTORY_GET_MOVEMENTS, {
    productId: filters.productId || undefined,
    type: filters.type && filters.type !== 'all' ? filters.type : undefined,
  })

  let movements = raw.map(toMovement)

  if (filters.search) {
    const q = filters.search.toLowerCase()
    movements = movements.filter((m) =>
      m.productName.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      (m.reference?.toLowerCase().includes(q) ?? false),
    )
  }

  const total = movements.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage

  return { data: movements.slice(start, start + perPage), total, page: safePage, perPage, totalPages }
}

export async function adjustStock(data: StockAdjustmentFormData): Promise<Movement> {
  const raw = await ipcInvoke<RawMovement>(IPC.INVENTORY_ADJUST, {
    productId: data.productId,
    type: data.type,
    quantity: data.quantity,
    reason: data.reason || undefined,
  })
  return toMovement(raw)
}

// ─── Suppliers ───────────────────────────────────────────────────

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  company: string | null
  isActive: boolean
  productCount: number
  createdAt: string
}

interface RawSupplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  company: string | null
  isActive: boolean
  createdAt: string | Date
  _count?: { products: number }
}

function toSupplier(raw: RawSupplier): Supplier {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    address: raw.address,
    company: raw.company,
    isActive: raw.isActive,
    productCount: raw._count?.products ?? 0,
    createdAt: toIso(raw.createdAt),
  }
}

export interface SupplierFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
}

export async function fetchSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  if (!isElectron()) return []

  const raw = await ipcInvoke<RawSupplier[]>(IPC.SUPPLIER_GET_ALL, {
    search: filters.search || undefined,
    isActive: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
  })
  return raw.map(toSupplier)
}

export async function addSupplier(data: SupplierFormData): Promise<Supplier> {
  const raw = await ipcInvoke<RawSupplier>(IPC.SUPPLIER_CREATE, {
    name: data.name,
    email: data.email || undefined,
    phone: data.phone || undefined,
    address: data.address || undefined,
    company: data.company || undefined,
  })
  return toSupplier(raw)
}

export async function updateSupplier(id: string, data: SupplierFormData): Promise<Supplier> {
  const raw = await ipcInvoke<RawSupplier>(IPC.SUPPLIER_UPDATE, id, {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    company: data.company || null,
  })
  return toSupplier(raw)
}

export async function deleteSupplier(id: string): Promise<void> {
  await ipcInvoke<void>(IPC.SUPPLIER_DELETE, id)
}

// ─── Purchase Orders ─────────────────────────────────────────────

export type PurchaseOrderStatus = 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  cost: number
  receivedQty: number
}

export interface PurchaseOrder {
  id: string
  orderNo: string
  supplierId: string
  supplierName: string
  status: PurchaseOrderStatus
  note: string | null
  totalCost: number
  items: PurchaseOrderItem[]
  createdAt: string
  receivedAt: string | null
}

interface RawPurchaseOrderItem {
  id: string
  productId: string
  quantity: number
  cost: number
  receivedQty: number
  product?: { name: string; sku: string } | null
}

interface RawPurchaseOrder {
  id: string
  orderNo: string
  supplierId: string
  supplier?: { name: string } | null
  status: PurchaseOrderStatus
  note: string | null
  totalCost: number
  items: RawPurchaseOrderItem[]
  createdAt: string | Date
  receivedAt: string | Date | null
}

function toPurchaseOrder(raw: RawPurchaseOrder): PurchaseOrder {
  return {
    id: raw.id,
    orderNo: raw.orderNo,
    supplierId: raw.supplierId,
    supplierName: raw.supplier?.name ?? '',
    status: raw.status,
    note: raw.note,
    totalCost: raw.totalCost,
    items: raw.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product?.name ?? '',
      sku: i.product?.sku ?? '',
      quantity: i.quantity,
      cost: i.cost,
      receivedQty: i.receivedQty,
    })),
    createdAt: toIso(raw.createdAt),
    receivedAt: raw.receivedAt ? toIso(raw.receivedAt) : null,
  }
}

export interface PurchaseOrderFilters {
  search?: string
  status?: 'all' | 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
}

export async function fetchPurchaseOrders(filters: PurchaseOrderFilters = {}): Promise<PurchaseOrder[]> {
  if (!isElectron()) return []

  const raw = await ipcInvoke<RawPurchaseOrder[]>(IPC.PURCHASE_ORDER_GET_ALL, {
    search: filters.search || undefined,
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
  })
  return raw.map(toPurchaseOrder)
}

export async function createPurchaseOrder(data: PurchaseOrderFormData): Promise<PurchaseOrder> {
  const raw = await ipcInvoke<RawPurchaseOrder>(IPC.PURCHASE_ORDER_CREATE, {
    supplierId: data.supplierId,
    note: data.note || undefined,
    items: data.items.map((i) => ({ productId: i.productId, quantity: i.quantity, cost: i.cost })),
  })
  return toPurchaseOrder(raw)
}

export async function receiveStock(
  orderId: string,
  items: { itemId: string; quantity: number }[],
): Promise<PurchaseOrder> {
  const raw = await ipcInvoke<RawPurchaseOrder>(IPC.PURCHASE_ORDER_RECEIVE, {
    purchaseOrderId: orderId,
    items,
  })
  return toPurchaseOrder(raw)
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const raw = await ipcInvoke<RawPurchaseOrder>(IPC.PURCHASE_ORDER_CANCEL, id)
  return toPurchaseOrder(raw)
}

export async function fetchActiveProducts(): Promise<Product[]> {
  if (!isElectron()) return []

  const raw = await ipcInvoke<RawProduct[]>(IPC.PRODUCT_GET_ALL, { isActive: true })
  return raw.map(toProduct)
}
