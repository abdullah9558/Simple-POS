import { type InputHTMLAttributes, forwardRef } from 'react'

export interface SearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void
}

const Search = forwardRef<HTMLInputElement, SearchProps>(
  ({ value, onClear, className = '', ...props }, ref) => {
    return (
      <div className={`relative ${className}`}>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={ref}
          type="search"
          value={value}
          className="h-9 w-full rounded-md border border-border-subtle bg-surface-raised pl-9 pr-8 text-body text-text-primary placeholder:text-text-muted transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-text-muted transition-fast transition-colors hover:text-text-primary"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  },
)
Search.displayName = 'Search'

export default Search
