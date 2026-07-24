import { Badge } from '../ui'

interface Props {
  stock: number
  minStock: number
}

export default function StockBadge({ stock, minStock }: Props) {
  if (stock === 0) return <Badge variant="danger">Out of Stock</Badge>
  if (stock < minStock) return <Badge variant="warning">Low Stock</Badge>
  return <Badge variant="success">In Stock</Badge>
}
