import StatCards from '../components/StatCards'
import QuickActions from '../components/QuickActions'
import RecentSalesTable from '../components/RecentSalesTable'

export default function DashboardPage() {
  return (
    <div className="flex flex-col section-gap">
      <div>
        <h2 className="text-subheading text-text-primary">Welcome back</h2>
        <p className="mt-1 text-body text-text-secondary">Here's what's happening today.</p>
      </div>
      <StatCards />
      <QuickActions />
      <RecentSalesTable />
    </div>
  )
}
