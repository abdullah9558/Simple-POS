import { type InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-9 rounded-md border bg-surface-raised px-3 text-body text-text-primary placeholder:text-text-muted transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${
            error ? 'border-danger' : 'border-border-subtle'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-caption text-danger">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export default Input
