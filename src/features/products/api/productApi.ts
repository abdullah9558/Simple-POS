import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import type { ProductFormData } from '../schemas/productSchema'

export interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  cost: number
  stock: number
  minStock: number
  isActive: boolean
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface RawProduct {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  cost: number
  stock: number
  minStock: number
  isActive: boolean
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
  createdAt: string | Date
  updatedAt: string | Date
}

function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

export function toProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    sku: raw.sku,
    barcode: raw.barcode ?? '',
    price: raw.price,
    cost: raw.cost,
    stock: raw.stock,
    minStock: raw.minStock,
    isActive: raw.isActive,
    category: raw.category ? { id: raw.category.id, name: raw.category.name } : null,
    supplier: raw.supplier ? { id: raw.supplier.id, name: raw.supplier.name } : null,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export interface ProductFilters {
  search?: string
  categoryId?: string
  status?: 'all' | 'active' | 'inactive'
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
}

export type SortField = 'name' | 'sku' | 'price' | 'stock' | 'category' | 'updatedAt'
export type SortDirection = 'asc' | 'desc'

export interface ProductQuery {
  filters?: ProductFilters
  page?: number
  perPage?: number
  sortField?: SortField
  sortDir?: SortDirection
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

function matchesStockStatus(product: Product, stockStatus?: ProductFilters['stockStatus']): boolean {
  if (!stockStatus || stockStatus === 'all') return true
  if (stockStatus === 'out-of-stock') return product.stock === 0
  if (stockStatus === 'low-stock') return product.stock > 0 && product.stock < product.minStock
  if (stockStatus === 'in-stock') return product.stock >= product.minStock
  return true
}

function sortProducts(products: Product[], field: SortField, dir: SortDirection): Product[] {
  const sorted = [...products]
  const mul = dir === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    switch (field) {
      case 'name':
        return mul * a.name.localeCompare(b.name)
      case 'sku':
        return mul * a.sku.localeCompare(b.sku)
      case 'price':
        return mul * (a.price - b.price)
      case 'stock':
        return mul * (a.stock - b.stock)
      case 'category':
        return mul * (a.category?.name ?? '').localeCompare(b.category?.name ?? '')
      case 'updatedAt':
        return mul * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      default:
        return 0
    }
  })

  return sorted
}

export async function fetchProducts(query: ProductQuery = {}): Promise<PaginatedResult<Product>> {
  const { filters = {}, page = 1, perPage = 10, sortField = 'name', sortDir = 'asc' } = query

  if (!isElectron()) {
    return { data: [], total: 0, page: 1, perPage, totalPages: 1 }
  }

  const raw = await ipcInvoke<RawProduct[]>(IPC.PRODUCT_GET_ALL, {
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    isActive: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
  })

  let products = raw.map(toProduct).filter((p) => matchesStockStatus(p, filters.stockStatus))
  products = sortProducts(products, sortField, sortDir)

  const total = products.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage
  const data = products.slice(start, start + perPage)

  return { data, total, page: safePage, perPage, totalPages }
}

export async function fetchSuppliers(): Promise<{ id: string; name: string }[]> {
  if (!isElectron()) return []

  const raw = await ipcInvoke<Array<{ id: string; name: string }>>(IPC.SUPPLIER_GET_ALL, {})
  return raw.map((s) => ({ id: s.id, name: s.name }))
}

export async function addProduct(data: ProductFormData): Promise<Product> {
  const raw = await ipcInvoke<RawProduct>(IPC.PRODUCT_CREATE, {
    name: data.name,
    sku: data.sku,
    barcode: data.barcode || undefined,
    price: data.price,
    cost: data.cost,
    stock: data.stock,
    minStock: data.minStock,
    categoryId: data.categoryId || undefined,
    supplierId: data.supplierId || undefined,
  })
  return toProduct(raw)
}

export async function updateProduct(id: string, data: ProductFormData): Promise<Product> {
  const raw = await ipcInvoke<RawProduct>(IPC.PRODUCT_UPDATE, id, {
    name: data.name,
    sku: data.sku,
    barcode: data.barcode || null,
    price: data.price,
    cost: data.cost,
    minStock: data.minStock,
    categoryId: data.categoryId || null,
    supplierId: data.supplierId || null,
  })
  return toProduct(raw)
}

export async function deleteProduct(id: string): Promise<void> {
  await ipcInvoke<void>(IPC.PRODUCT_DELETE, id)
}
