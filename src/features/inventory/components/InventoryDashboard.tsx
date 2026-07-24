import { Card, CardContent } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'

interface Props {
  totalProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-caption text-text-muted">{label}</p>
        <p className={`mt-1 text-h3 tabular-nums ${color ?? 'text-text-primary'}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export default function InventoryDashboard({ totalProducts, inStock, lowStock, outOfStock, totalValue }: Props) {
  const { formatCurrency } = useCurrency()

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard label="Total Products" value={totalProducts} />
      <StatCard label="In Stock" value={inStock} color="text-success" />
      <StatCard label="Low Stock" value={lowStock} color="text-warning" />
      <StatCard label="Out of Stock" value={outOfStock} color="text-danger" />
      <StatCard label="Inventory Value" value={formatCurrency(totalValue)} />
    </div>
  )
}
