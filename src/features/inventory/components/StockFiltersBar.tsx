import { Search } from '../../../components/ui'
import type { StockFilters } from '../api/inventoryApi'

interface Props {
  filters: StockFilters
  onChange: (filters: StockFilters) => void
  total: number
}

export default function StockFiltersBar({ filters, onChange, total }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Search
          placeholder="Search product or SKU..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.currentTarget.value || undefined })}
          className="w-full sm:w-64"
        />
        <select
          value={filters.stockStatus ?? 'all'}
          onChange={(e) => onChange({ ...filters, stockStatus: e.target.value as StockFilters['stockStatus'] })}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>
      <span className="shrink-0 text-caption text-text-muted">{total} products</span>
    </div>
  )
}
