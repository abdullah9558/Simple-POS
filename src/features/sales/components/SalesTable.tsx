import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import SortableHead from '../../../components/shared/SortableHead'
import EmptyState from '../../../components/shared/EmptyState'
import { formatDateTime } from '../../../lib/format'
import { useCurrency } from '../../../hooks/useCurrency'
import type { Sale, SaleSortField } from '../api/salesApi'
import type { SortDirection } from '../../../shared/types'

interface Props {
  sales: Sale[]
  sortField: SaleSortField
  sortDir: SortDirection
  onSort: (field: SaleSortField) => void
  onView: (sale: Sale) => void
  onRefund: (sale: Sale) => void
}

function StatusBadge({ status }: { status: Sale['status'] }) {
  const variant = status === 'COMPLETED' ? 'success' : status === 'REFUNDED' ? 'danger' : 'warning'
  return <Badge variant={variant}>{status}</Badge>
}

function MethodBadge({ method }: { method: Sale['method'] }) {
  return <Badge variant="default">{method}</Badge>
}

export default function SalesTable({ sales, sortField, sortDir, onSort, onView, onRefund }: Props) {
  const { formatCurrency } = useCurrency()

  if (sales.length === 0) {
    return <EmptyState title="No sales found" description="Try adjusting your search or filters" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead field="invoiceNo" label="Invoice" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead>Customer</TableHead>
          <TableHead>Items</TableHead>
          <SortableHead field="total" label="Total" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="method" label="Method" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="createdAt" label="Date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell>
              <button type="button" onClick={() => onView(sale)} className="font-mono text-body-medium text-accent hover:underline">
                {sale.invoiceNo}
              </button>
            </TableCell>
            <TableCell>{sale.customerName ?? <span className="text-text-muted">Walk-in</span>}</TableCell>
            <TableCell className="tabular-nums">{sale.itemCount}</TableCell>
            <TableCell className="tabular-nums font-medium text-text-primary">{formatCurrency(sale.total)}</TableCell>
            <TableCell><MethodBadge method={sale.method} /></TableCell>
            <TableCell><StatusBadge status={sale.status} /></TableCell>
            <TableCell className="text-caption text-text-muted">{formatDateTime(sale.createdAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onView(sale)} aria-label={`View ${sale.invoiceNo}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                </Button>
                {sale.status === 'COMPLETED' && (
                  <Button variant="ghost" size="sm" onClick={() => onRefund(sale)} className="text-danger hover:text-danger" aria-label={`Refund ${sale.invoiceNo}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
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
