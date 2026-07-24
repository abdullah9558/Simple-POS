import { TableHead } from '../ui'

export type SortDirection = 'asc' | 'desc'

interface SortIconProps {
  active: boolean
  dir: SortDirection
}

function SortIcon({ active, dir }: SortIconProps) {
  if (!active) {
    return (
      <svg className="ml-1 inline h-3.5 w-3.5 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    )
  }
  return (
    <svg className="ml-1 inline h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      {dir === 'asc' ? <path d="m7 15 5-5 5 5" /> : <path d="m7 9 5 5 5-5" />}
    </svg>
  )
}

interface Props<T extends string> {
  field: T
  label: string
  sortField: T
  sortDir: SortDirection
  onSort: (field: T) => void
  className?: string
}

export default function SortableHead<T extends string>({ field, label, sortField, sortDir, onSort, className }: Props<T>) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-0.5 text-overline text-text-muted hover:text-text-primary transition-fast transition-colors"
      >
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </button>
    </TableHead>
  )
}
