import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import SortableHead from '../../../components/shared/SortableHead'
import EmptyState from '../../../components/shared/EmptyState'
import { useCurrency } from '../../../hooks/useCurrency'
import type { Customer, CustomerSortField } from '../api/customerApi'
import type { SortDirection } from '../../../shared/types'

interface Props {
  customers: Customer[]
  sortField: CustomerSortField
  sortDir: SortDirection
  onSort: (field: CustomerSortField) => void
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export default function CustomerTable({ customers, sortField, sortDir, onSort, onView, onEdit, onDelete }: Props) {
  const { formatCurrency } = useCurrency()

  if (customers.length === 0) {
    return <EmptyState title="No customers found" description="Add a customer or adjust your filters" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead field="name" label="Name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead>Contact</TableHead>
          <SortableHead field="creditBalance" label="Credit" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
          <SortableHead field="outstandingBalance" label="Outstanding" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
          <SortableHead field="saleCount" label="Orders" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="totalSpent" label="Total Spent" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
          <TableHead className="w-28"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <button type="button" onClick={() => onView(c)} className="font-medium text-accent hover:underline">{c.name}</button>
            </TableCell>
            <TableCell>
              <div className="text-caption text-text-secondary">
                {c.email && <div>{c.email}</div>}
                {c.phone && <div className="text-text-muted">{c.phone}</div>}
                {c.whatsapp && <div className="text-text-muted">WA: {c.whatsapp}</div>}
                {!c.email && !c.phone && !c.whatsapp && <span className="text-text-muted">--</span>}
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {c.creditBalance > 0 ? <Badge variant="success">{formatCurrency(c.creditBalance)}</Badge> : <span className="text-text-muted">--</span>}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {c.outstandingBalance > 0 ? <Badge variant="danger">{formatCurrency(c.outstandingBalance)}</Badge> : <span className="text-text-muted">--</span>}
            </TableCell>
            <TableCell className="tabular-nums">{c.saleCount}</TableCell>
            <TableCell className="text-right tabular-nums font-medium">{formatCurrency(c.totalSpent)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onView(c)} aria-label={`View ${c.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(c)} className="text-danger hover:text-danger" aria-label={`Delete ${c.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
