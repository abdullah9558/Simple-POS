import type { HTMLAttributes } from 'react'

const variantStyles = {
  default: 'bg-surface-inset text-text-secondary border-border-subtle',
  success: 'bg-success-muted text-success border-success/20',
  warning: 'bg-warning-muted text-warning border-warning/20',
  danger:  'bg-danger-muted text-danger border-danger/20',
  info:    'bg-info-muted text-info border-info/20',
  accent:  'bg-accent-muted text-accent border-accent/20',
} as const

export type BadgeVariant = keyof typeof variantStyles

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export default function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-caption-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
