import { Badge, Spinner, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import { useRecentSales } from '../hooks/useDashboard'
import type { BadgeVariant } from '../../../components/ui'

const statusVariant: Record<string, BadgeVariant> = {
  completed: 'success',
  pending: 'warning',
  refunded: 'danger',
}

const methodVariant: Record<string, BadgeVariant> = {
  Cash: 'default',
  Card: 'info',
  Mobile: 'accent',
}

export default function RecentSalesTable() {
  const { data: recentSales = [], isLoading } = useRecentSales()
  const { formatCurrency } = useCurrency()

  return (
    <div className="surface-card p-0 overflow-hidden">
      <div className="flex items-center justify-between card-padding pb-0 mb-4">
        <h3 className="text-body-medium text-text-primary">Recent Sales</h3>
        <span className="text-caption text-text-muted">Last 24 hours</span>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : recentSales.length === 0 ? (
        <p className="px-6 pb-6 text-body text-text-muted">No recent sales</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-text-primary">{sale.id}</TableCell>
                <TableCell className="text-text-primary">{sale.customer}</TableCell>
                <TableCell>{sale.items}</TableCell>
                <TableCell className="text-text-primary font-medium">{formatCurrency(sale.total)}</TableCell>
                <TableCell>
                  <Badge variant={methodVariant[sale.method]}>{sale.method}</Badge>
                </TableCell>
                <TableCell>{sale.time}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[sale.status]}>
                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
