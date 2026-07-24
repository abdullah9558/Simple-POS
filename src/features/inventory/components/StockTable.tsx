import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '../../../components/ui'
import SortableHead from '../../../components/shared/SortableHead'
import StockBadge from '../../../components/shared/StockBadge'
import EmptyState from '../../../components/shared/EmptyState'
import { useCurrency } from '../../../hooks/useCurrency'
import type { Product } from '../../products/api/productApi'
import type { StockSortField } from '../api/inventoryApi'
import type { SortDirection } from '../../../shared/types'

interface Props {
  products: Product[]
  sortField: StockSortField
  sortDir: SortDirection
  onSort: (field: StockSortField) => void
  onAdjust: (product: Product) => void
}

export default function StockTable({ products, sortField, sortDir, onSort, onAdjust }: Props) {
  const { formatCurrency } = useCurrency()

  if (products.length === 0) {
    return <EmptyState title="No products found" description="Try adjusting your search or filters" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead field="name" label="Product" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="sku" label="SKU" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead>Category</TableHead>
          <SortableHead field="stock" label="Stock" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="cost" label="Cost" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead>Status</TableHead>
          <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium text-text-primary">{product.name}</TableCell>
            <TableCell><span className="font-mono text-caption text-text-muted">{product.sku}</span></TableCell>
            <TableCell>{product.category?.name ?? <span className="text-text-muted">--</span>}</TableCell>
            <TableCell>
              <span className="tabular-nums">{product.stock}</span>
              <span className="text-caption text-text-muted"> / {product.minStock}</span>
            </TableCell>
            <TableCell className="tabular-nums">{formatCurrency(product.cost)}</TableCell>
            <TableCell><StockBadge stock={product.stock} minStock={product.minStock} /></TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onAdjust(product)} aria-label={`Adjust stock for ${product.name}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18" /><path d="M3 12h18" /></svg>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
