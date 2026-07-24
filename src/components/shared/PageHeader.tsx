import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-h2 text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-body text-text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
