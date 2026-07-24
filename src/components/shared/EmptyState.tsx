import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
}

export default function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-raised py-16">
      {icon ?? (
        <svg className="h-12 w-12 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )}
      <p className="mt-4 text-body text-text-muted">{title}</p>
      {description && <p className="mt-1 text-caption text-text-muted/70">{description}</p>}
    </div>
  )
}
