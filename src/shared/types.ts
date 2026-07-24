export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export type SortDirection = 'asc' | 'desc'
