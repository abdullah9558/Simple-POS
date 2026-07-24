import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import EmptyState from '../../../components/shared/EmptyState'
import type { Supplier } from '../api/inventoryApi'

interface Props {
  suppliers: Supplier[]
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
}

export default function SupplierTable({ suppliers, onEdit, onDelete }: Props) {
  if (suppliers.length === 0) {
    return <EmptyState title="No suppliers found" description="Add a supplier to get started" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium text-text-primary">{s.name}</TableCell>
            <TableCell>{s.company ?? <span className="text-text-muted">--</span>}</TableCell>
            <TableCell className="text-caption">{s.email ?? <span className="text-text-muted">--</span>}</TableCell>
            <TableCell className="text-caption">{s.phone ?? <span className="text-text-muted">--</span>}</TableCell>
            <TableCell className="tabular-nums">{s.productCount}</TableCell>
            <TableCell><Badge variant={s.isActive ? 'success' : 'default'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(s)} aria-label={`Edit ${s.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(s)} className="text-danger hover:text-danger" aria-label={`Delete ${s.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
