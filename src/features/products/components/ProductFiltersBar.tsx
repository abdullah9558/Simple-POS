import { Search, Button } from '../../../components/ui'
import type { ProductFilters } from '../api/productApi'
import { useCategoryDropdown } from '../../categories/hooks/useCategories'

interface Props {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
  total: number
}

export default function ProductFiltersBar({ filters, onChange, total }: Props) {
  const { data: categories = [] } = useCategoryDropdown()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Search
          placeholder="Search products..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.currentTarget.value })}
          onClear={() => onChange({ ...filters, search: '' })}
          className="w-full sm:w-72"
        />

        <select
          value={filters.categoryId ?? ''}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 pr-8 text-body text-text-primary transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filters.status ?? 'all'}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ProductFilters['status'] })}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 pr-8 text-body text-text-primary transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.stockStatus ?? 'all'}
          onChange={(e) => onChange({ ...filters, stockStatus: e.target.value as ProductFilters['stockStatus'] })}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 pr-8 text-body text-text-primary transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        >
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>

        {(filters.search || filters.categoryId || (filters.status && filters.status !== 'all') || (filters.stockStatus && filters.stockStatus !== 'all')) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ search: '', categoryId: undefined, status: 'all', stockStatus: 'all' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <span className="shrink-0 text-caption text-text-muted">
        {total} {total === 1 ? 'product' : 'products'}
      </span>
    </div>
  )
}
