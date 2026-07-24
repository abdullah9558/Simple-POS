import { Modal, Badge } from '../../../components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui'
import { formatDateTime } from '../../../lib/format'
import { useCurrency } from '../../../hooks/useCurrency'
import type { Sale } from '../api/salesApi'

interface Props {
  open: boolean
  sale: Sale | null
  onClose: () => void
}

export default function SaleDetailModal({ open, sale, onClose }: Props) {
  const { formatCurrency } = useCurrency()

  if (!sale) return null

  const statusVariant = sale.status === 'COMPLETED' ? 'success' : sale.status === 'REFUNDED' ? 'danger' : 'warning'

  return (
    <Modal open={open} onClose={onClose} title={`Invoice ${sale.invoiceNo}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-caption text-text-muted">Status</p>
            <Badge variant={statusVariant} className="mt-1">{sale.status}</Badge>
          </div>
          <div>
            <p className="text-caption text-text-muted">Payment</p>
            <p className="mt-1 text-body-medium text-text-primary">{sale.method}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Customer</p>
            <p className="mt-1 text-body-medium text-text-primary">{sale.customerName ?? 'Walk-in'}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Date</p>
            <p className="mt-1 text-body-medium text-text-primary">{formatDateTime(sale.createdAt)}</p>
          </div>
        </div>

        {sale.note && (
          <div className="rounded-lg bg-surface-inset px-4 py-3">
            <p className="text-caption text-text-muted">Note</p>
            <p className="mt-1 text-body text-text-secondary">{sale.note}</p>
          </div>
        )}

        <div>
          <h3 className="mb-3 text-body-medium text-text-primary">Line Items</h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-text-primary">{item.productName}</TableCell>
                  <TableCell><span className="font-mono text-caption text-text-muted">{item.sku}</span></TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2 border-t border-border-subtle pt-4">
          <div className="flex justify-between text-body text-text-secondary">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-body text-success">
              <span>Discount</span>
              <span className="tabular-nums">-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-body text-text-secondary">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(sale.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-2">
            <span className="text-body-medium text-text-primary">Grand Total</span>
            <span className="text-subheading tabular-nums text-text-primary">{formatCurrency(sale.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
