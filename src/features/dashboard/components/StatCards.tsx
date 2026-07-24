import { Spinner } from '../../../components/ui'
import { useDashboardStats } from '../hooks/useDashboard'
import type { DashboardStat } from '../api/dashboardApi'

export default function StatCards() {
  const { data: stats = [], isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (stats.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-4 gutter-gap">
      {stats.map((stat) => (
        <StatCardItem key={stat.label} stat={stat} />
      ))}
    </div>
  )
}

function StatCardItem({ stat }: { stat: DashboardStat }) {
  const isPositive = stat.change >= 0
  const isStock = stat.icon === 'stock'

  return (
    <div className="surface-card card-padding flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-muted">{stat.label}</span>
        <StatIcon type={stat.icon} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-heading text-text-primary">{stat.value}</span>
        {stat.change !== 0 && (
          <span
            className={`text-caption-medium ${
              isStock
                ? 'text-warning'
                : isPositive
                  ? 'text-success'
                  : 'text-danger'
            }`}
          >
            {isStock ? '' : isPositive ? '+' : ''}
            {stat.change}
            {isStock ? ' items' : '%'}
          </span>
        )}
      </div>
    </div>
  )
}

function StatIcon({ type }: { type: DashboardStat['icon'] }) {
  const base = 'h-9 w-9 flex items-center justify-center rounded-lg'

  const styles: Record<DashboardStat['icon'], string> = {
    sales: `${base} bg-accent-muted text-accent`,
    orders: `${base} bg-info-muted text-info`,
    profit: `${base} bg-success-muted text-success`,
    stock: `${base} bg-warning-muted text-warning`,
  }

  return (
    <div className={styles[type]}>
      {type === 'sales' && (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )}
      {type === 'orders' && (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      )}
      {type === 'profit' && (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
      )}
      {type === 'stock' && (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      )}
    </div>
  )
}
