import { useNavigate } from 'react-router'

interface QuickAction {
  label: string
  description: string
  icon: 'pos' | 'product' | 'customer' | 'report'
  to: string
}

const quickActions: QuickAction[] = [
  { label: 'New Sale', description: 'Start checkout', icon: 'pos', to: '/checkout' },
  { label: 'Add Product', description: 'Inventory', icon: 'product', to: '/products' },
  { label: 'Add Customer', description: 'CRM', icon: 'customer', to: '/customers' },
  { label: 'View Reports', description: 'Analytics', icon: 'report', to: '/reports' },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="surface-card card-padding">
      <h3 className="text-body-medium text-text-primary mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 gutter-gap">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.to)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface p-4 transition-default transition-colors hover:border-border-default hover:bg-surface-raised"
          >
            <ActionIcon type={action.icon} />
            <span className="text-body-medium text-text-primary">{action.label}</span>
            <span className="text-caption text-text-muted">{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActionIcon({ type }: { type: QuickAction['icon'] }) {
  const base = 'h-10 w-10 flex items-center justify-center rounded-xl bg-accent-muted text-accent'

  return (
    <div className={base}>
      {type === 'pos' && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M12 17v4" /><path d="M8 21h8" />
        </svg>
      )}
      {type === 'product' && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
      )}
      {type === 'customer' && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" />
        </svg>
      )}
      {type === 'report' && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
        </svg>
      )}
    </div>
  )
}
