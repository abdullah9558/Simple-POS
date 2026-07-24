import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import type { Category, CategorySortField, SortDirection } from '../api/categoryApi'

interface Props {
  categories: Category[]
  sortField: CategorySortField
  sortDir: SortDirection
  onSort: (field: CategorySortField) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
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

function SortableHead({ field, label, sortField, sortDir, onSort }: { field: CategorySortField; label: string; sortField: CategorySortField; sortDir: SortDirection; onSort: (f: CategorySortField) => void }) {
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

export default function CategoryTable({ categories, sortField, sortDir, onSort, onEdit, onDelete }: Props) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-raised py-16">
        <svg className="h-12 w-12 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
          <path d="M6 9.01V9" />
          <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
        </svg>
        <p className="mt-4 text-body text-text-muted">No categories found</p>
        <p className="mt-1 text-caption text-text-muted/70">Try adjusting your search</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead field="name" label="Name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead>Description</TableHead>
          <SortableHead field="productCount" label="Products" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="updatedAt" label="Updated" sortField={sortField} sortDir={sortDir} onSort={onSort} />
          <TableHead className="w-20"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((cat) => (
          <TableRow key={cat.id}>
            <TableCell>
              <span className="font-medium text-text-primary">{cat.name}</span>
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {cat.description || <span className="text-text-muted">--</span>}
            </TableCell>
            <TableCell>
              <Badge variant={cat.productCount > 0 ? 'accent' : 'default'}>
                {cat.productCount}
              </Badge>
            </TableCell>
            <TableCell className="text-caption text-text-muted">
              {new Date(cat.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(cat)} aria-label={`Edit ${cat.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(cat)} aria-label={`Delete ${cat.name}`} className="text-danger hover:text-danger">
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
