import { Search } from '../../../components/ui'
import type { SaleFilters } from '../api/salesApi'

interface Props {
  filters: SaleFilters
  onChange: (filters: SaleFilters) => void
  total: number
}

export default function SaleFiltersBar({ filters, onChange, total }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Search
          placeholder="Search invoice, customer, product..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.currentTarget.value || undefined })}
          className="w-full sm:w-64"
        />

        <select
          value={filters.status ?? 'all'}
          onChange={(e) => onChange({ ...filters, status: e.target.value as SaleFilters['status'] })}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <select
          value={filters.method ?? 'all'}
          onChange={(e) => onChange({ ...filters, method: e.target.value as SaleFilters['method'] })}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="MOBILE">Mobile</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          aria-label="Date from"
        />
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          aria-label="Date to"
        />
      </div>

      <span className="shrink-0 text-caption text-text-muted">{total} sales</span>
    </div>
  )
}
