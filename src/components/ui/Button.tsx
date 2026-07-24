import { type ButtonHTMLAttributes, forwardRef } from 'react'

const variantStyles = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:brightness-90',
  secondary:
    'bg-surface-raised text-text-primary border border-border-subtle hover:border-border-default active:brightness-90',
  ghost:
    'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-90',
} as const

const sizeStyles = {
  sm: 'h-8 px-3 text-caption gap-1.5 rounded-sm',
  md: 'h-9 px-4 text-body gap-2 rounded-md',
  lg: 'h-10 px-5 text-body gap-2 rounded-md',
} as const

export type ButtonVariant = keyof typeof variantStyles
export type ButtonSize = keyof typeof sizeStyles

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-default transition-colors focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading && <ButtonSpinner />}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

function ButtonSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default Button
