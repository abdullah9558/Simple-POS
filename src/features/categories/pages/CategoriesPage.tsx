import { useState, useCallback } from 'react'
import { Button, Search, Spinner, ConfirmationDialog, useToast } from '../../../components/ui'
import { useCategoryList, useDeleteCategory } from '../hooks/useCategories'
import CategoryTable from '../components/CategoryTable'
import AddCategoryDialog from '../components/AddCategoryDialog'
import EditCategoryDialog from '../components/EditCategoryDialog'
import type { Category, CategorySortField, SortDirection } from '../api/categoryApi'

export default function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<CategorySortField>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [showAdd, setShowAdd] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const { data: categories, isLoading, isError } = useCategoryList({
    filters: { search },
    sortField,
    sortDir,
  })

  const deleteMutation = useDeleteCategory()
  const { toast } = useToast()

  const handleSort = useCallback(
    (field: CategorySortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCategory) return
    try {
      await deleteMutation.mutateAsync(deletingCategory.id)
      toast(`"${deletingCategory.name}" deleted successfully`, 'success')
      setDeletingCategory(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      toast(message, 'error')
    }
  }, [deletingCategory, deleteMutation, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Categories</h1>
          <p className="mt-1 text-body text-text-muted">Organize products by category</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add Category
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Search
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onClear={() => setSearch('')}
          className="w-full sm:w-72"
        />
        <span className="shrink-0 text-caption text-text-muted">
          {categories?.length ?? 0} {(categories?.length ?? 0) === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger-muted py-16">
          <p className="text-body text-danger">Failed to load categories</p>
        </div>
      ) : (
        <CategoryTable
          categories={categories ?? []}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={setEditingCategory}
          onDelete={setDeletingCategory}
        />
      )}

      <AddCategoryDialog open={showAdd} onClose={() => setShowAdd(false)} />

      {editingCategory && (
        <EditCategoryDialog
          open
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      <ConfirmationDialog
        open={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={
          deletingCategory?.productCount
            ? `"${deletingCategory.name}" has ${deletingCategory.productCount} products. Remove all products from this category before deleting.`
            : `Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
