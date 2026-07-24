import { Modal, Badge, Spinner } from '../../../components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui'
import { formatDateTime } from '../../../lib/format'
import { useCurrency } from '../../../hooks/useCurrency'
import { usePurchaseHistory } from '../hooks/useCustomers'
import type { Customer } from '../api/customerApi'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
}

export default function CustomerDetailModal({ open, customer, onClose }: Props) {
  const { formatCurrency } = useCurrency()
  const { data: history, isLoading } = usePurchaseHistory(open && customer ? customer.id : null)

  if (!customer) return null

  return (
    <Modal open={open} onClose={onClose} title={customer.name} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-caption text-text-muted">Credit Balance</p>
            <p className="mt-1 text-body-medium tabular-nums text-success">{formatCurrency(customer.creditBalance)}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Outstanding</p>
            <p className="mt-1 text-body-medium tabular-nums text-danger">{formatCurrency(customer.outstandingBalance)}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Total Orders</p>
            <p className="mt-1 text-body-medium tabular-nums">{customer.saleCount}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Total Spent</p>
            <p className="mt-1 text-body-medium tabular-nums">{formatCurrency(customer.totalSpent)}</p>
          </div>
        </div>

        {(customer.email || customer.phone || customer.whatsapp || customer.address) && (
          <div className="rounded-lg bg-surface-inset px-4 py-3 text-caption text-text-secondary space-y-1">
            {customer.email && <p>Email: {customer.email}</p>}
            {customer.phone && <p>Phone: {customer.phone}</p>}
            {customer.whatsapp && <p>WhatsApp: {customer.whatsapp}</p>}
            {customer.address && <p>Address: {customer.address}</p>}
          </div>
        )}

        <div>
          <h3 className="mb-3 text-body-medium text-text-primary">Purchase History</h3>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !history || history.length === 0 ? (
            <p className="text-body text-text-muted py-4 text-center">No purchases yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell><span className="font-mono text-accent">{sale.invoiceNo}</span></TableCell>
                    <TableCell className="tabular-nums">{sale.itemCount}</TableCell>
                    <TableCell>{sale.method}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === 'COMPLETED' ? 'success' : sale.status === 'REFUNDED' ? 'danger' : 'warning'}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(sale.total)}</TableCell>
                    <TableCell className="text-caption text-text-muted">{formatDateTime(sale.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Modal>
  )
}
