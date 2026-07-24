import { Button } from '../ui'

interface Props {
  page: number
  totalPages: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

const PER_PAGE_OPTIONS = [10, 25, 50]

export default function Pagination({ page, totalPages, perPage, total, onPageChange, onPerPageChange }: Props) {
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  function getPageNumbers(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)
    if (page > 3) pages.push('ellipsis')

    const rangeStart = Math.max(2, page - 1)
    const rangeEnd = Math.min(totalPages - 1, page + 1)
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)

    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  if (total === 0) return null

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-2 text-caption text-text-muted">
        <span>Showing {start}–{end} of {total}</span>
        <span className="text-border-subtle">|</span>
        <span>Rows:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="h-7 rounded border border-border-subtle bg-surface-raised px-1.5 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Button>

        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-1 text-text-muted">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-caption font-medium transition-fast transition-colors ${
                p === page ? 'bg-accent text-white' : 'text-text-muted hover:bg-surface-raised hover:text-text-primary'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
