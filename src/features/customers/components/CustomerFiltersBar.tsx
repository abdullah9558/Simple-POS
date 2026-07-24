import { Search } from '../../../components/ui'
import type { CustomerFilters } from '../api/customerApi'

interface Props {
  filters: CustomerFilters
  onChange: (filters: CustomerFilters) => void
  total: number
}

export default function CustomerFiltersBar({ filters, onChange, total }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Search
          placeholder="Search name, email, phone..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.currentTarget.value || undefined })}
          className="w-full sm:w-64"
        />
        <select
          value={filters.balanceStatus ?? 'all'}
          onChange={(e) => onChange({ ...filters, balanceStatus: e.target.value as CustomerFilters['balanceStatus'] })}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All Balances</option>
          <option value="has-credit">Has Credit</option>
          <option value="has-outstanding">Has Outstanding</option>
          <option value="clear">Clear Balance</option>
        </select>
      </div>
      <span className="shrink-0 text-caption text-text-muted">{total} customers</span>
    </div>
  )
}
