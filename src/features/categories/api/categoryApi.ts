import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'

export interface Category {
  id: string
  name: string
  description: string
  productCount: number
  createdAt: string
  updatedAt: string
}

interface RawCategory {
  id: string
  name: string
  description: string | null
  createdAt: string | Date
  updatedAt: string | Date
  _count: { products: number }
}

function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

function toCategory(raw: RawCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    productCount: raw._count.products,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export interface CategoryFilters {
  search?: string
}

export type CategorySortField = 'name' | 'productCount' | 'updatedAt'
export type SortDirection = 'asc' | 'desc'

export interface CategoryQuery {
  filters?: CategoryFilters
  sortField?: CategorySortField
  sortDir?: SortDirection
}

function sortCategories(categories: Category[], field: CategorySortField, dir: SortDirection): Category[] {
  const sorted = [...categories]
  const mul = dir === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    switch (field) {
      case 'name':
        return mul * a.name.localeCompare(b.name)
      case 'productCount':
        return mul * (a.productCount - b.productCount)
      case 'updatedAt':
        return mul * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      default:
        return 0
    }
  })

  return sorted
}

export async function fetchAllCategories(query: CategoryQuery = {}): Promise<Category[]> {
  if (!isElectron()) return []

  const { filters = {}, sortField = 'name', sortDir = 'asc' } = query
  const raw = await ipcInvoke<RawCategory[]>(IPC.CATEGORY_GET_ALL, {
    search: filters.search || undefined,
  })

  return sortCategories(raw.map(toCategory), sortField, sortDir)
}

export async function fetchCategoryDropdown(): Promise<{ id: string; name: string }[]> {
  if (!isElectron()) return []

  const raw = await ipcInvoke<RawCategory[]>(IPC.CATEGORY_GET_ALL, {})
  return raw.map((c) => ({ id: c.id, name: c.name }))
}

export async function addCategory(input: { name: string; description: string }): Promise<Category> {
  const raw = await ipcInvoke<RawCategory>(IPC.CATEGORY_CREATE, {
    name: input.name,
    description: input.description || undefined,
  })
  return toCategory(raw)
}

export async function updateCategory(id: string, input: { name: string; description: string }): Promise<Category> {
  const raw = await ipcInvoke<RawCategory>(IPC.CATEGORY_UPDATE, id, {
    name: input.name,
    description: input.description || undefined,
  })
  return toCategory(raw)
}

export async function deleteCategory(id: string): Promise<void> {
  await ipcInvoke<void>(IPC.CATEGORY_DELETE, id)
}
