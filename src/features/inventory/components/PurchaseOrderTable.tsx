import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import EmptyState from '../../../components/shared/EmptyState'
import { formatDateTime } from '../../../lib/format'
import { useCurrency } from '../../../hooks/useCurrency'
import type { PurchaseOrder } from '../api/inventoryApi'

interface Props {
  orders: PurchaseOrder[]
  onReceive: (order: PurchaseOrder) => void
  onCancel: (order: PurchaseOrder) => void
}

function StatusBadge({ status }: { status: PurchaseOrder['status'] }) {
  const map = { PENDING: 'warning', PARTIAL: 'default', RECEIVED: 'success', CANCELLED: 'danger' } as const
  return <Badge variant={map[status]}>{status}</Badge>
}

export default function PurchaseOrderTable({ orders, onReceive, onCancel }: Props) {
  const { formatCurrency } = useCurrency()

  if (orders.length === 0) {
    return <EmptyState title="No purchase orders" description="Create a purchase order to restock inventory" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Order No</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total Cost</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((po) => (
          <TableRow key={po.id}>
            <TableCell><span className="font-mono text-body-medium text-accent">{po.orderNo}</span></TableCell>
            <TableCell className="font-medium text-text-primary">{po.supplierName}</TableCell>
            <TableCell className="tabular-nums">{po.items.length}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(po.totalCost)}</TableCell>
            <TableCell><StatusBadge status={po.status} /></TableCell>
            <TableCell className="text-caption text-text-muted">{formatDateTime(po.createdAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {(po.status === 'PENDING' || po.status === 'PARTIAL') && (
                  <Button variant="ghost" size="sm" onClick={() => onReceive(po)} aria-label={`Receive ${po.orderNo}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                  </Button>
                )}
                {po.status === 'PENDING' && (
                  <Button variant="ghost" size="sm" onClick={() => onCancel(po)} className="text-danger hover:text-danger" aria-label={`Cancel ${po.orderNo}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
