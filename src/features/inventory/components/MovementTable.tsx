import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../../components/ui'
import EmptyState from '../../../components/shared/EmptyState'
import { formatDateTime } from '../../../lib/format'
import type { Movement } from '../api/inventoryApi'

interface Props {
  movements: Movement[]
}

function TypeBadge({ type }: { type: Movement['type'] }) {
  const variant = type === 'IN' || type === 'RETURN' ? 'success' : type === 'OUT' ? 'danger' : 'warning'
  return <Badge variant={variant}>{type}</Badge>
}

export default function MovementTable({ movements }: Props) {
  if (movements.length === 0) {
    return <EmptyState title="No movements found" description="Stock adjustments and transactions will appear here" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Reference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="text-caption text-text-muted">{formatDateTime(m.createdAt)}</TableCell>
            <TableCell className="font-medium text-text-primary">{m.productName}</TableCell>
            <TableCell><span className="font-mono text-caption text-text-muted">{m.sku}</span></TableCell>
            <TableCell><TypeBadge type={m.type} /></TableCell>
            <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
            <TableCell className="text-caption text-text-secondary">{m.reason ?? '--'}</TableCell>
            <TableCell><span className="font-mono text-caption text-text-muted">{m.reference ?? '--'}</span></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
