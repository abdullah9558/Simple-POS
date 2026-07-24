import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import type { Product, SortField, SortDirection } from '../api/productApi'

interface Props {
  products: Product[]
  sortField: SortField
  sortDir: SortDirection
  onSort: (field: SortField) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) {
    return (
      <svg className="ml-1 inline h-3.5 w-3.5 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    )
  }
  return (
    <svg className="ml-1 inline h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      {dir === 'asc' ? <path d="m7 15 5-5 5 5" /> : <path d="m7 9 5 5 5-5" />}
    </svg>
  )
}

function SortableHead({ field, label, sortField, sortDir, onSort }: { field: SortField; label: string; sortField: SortField; sortDir: SortDirection; onSort: (f: SortField) => void }) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-0.5 text-overline text-text-muted hover:text-text-primary transition-fast transition-colors"
      >
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </button>
    </TableHead>
  )
}

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) return <Badge variant="danger">Out of Stock</Badge>
  if (stock < minStock) return <Badge variant="warning">Low Stock</Badge>
  return <Badge variant="success">In Stock</Badge>
}

export default function ProductTable({ products, sortField, sortDir, onSort, onEdit, onDelete }: Props) {
  const { formatCurrency } = useCurrency()

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-raised py-16">
        <svg className="h-12 w-12 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="mt-4 text-body text-text-muted">No products found</p>
        <p className="mt-1 text-caption text-text-muted/70">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead field="name" label="Product" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="sku" label="SKU" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="category" label="Category" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="price" label="Price" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead className="text-right">Cost</TableHead>
          <SortableHead field="stock" label="Stock" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead>Status</TableHead>
          <SortableHead field="updatedAt" label="Updated" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div>
                <span className="font-medium text-text-primary">{product.name}</span>
                {!product.isActive && (
                  <Badge variant="default" className="ml-2">Inactive</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="font-mono text-caption text-text-muted">{product.sku}</span>
            </TableCell>
            <TableCell>{product.category?.name ?? <span className="text-text-muted">--</span>}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(product.price)}</TableCell>
            <TableCell className="text-right tabular-nums text-text-muted">{formatCurrency(product.cost)}</TableCell>
            <TableCell>
              <span className="tabular-nums">{product.stock}</span>
              <span className="text-text-muted/60 text-caption"> / {product.minStock}</span>
            </TableCell>
            <TableCell>
              <StockBadge stock={product.stock} minStock={product.minStock} />
            </TableCell>
            <TableCell className="text-caption text-text-muted">
              {new Date(product.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`} className="text-danger hover:text-danger">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
