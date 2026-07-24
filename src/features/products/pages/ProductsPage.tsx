import { useState, useCallback } from 'react'
import { Button, Spinner, ConfirmationDialog, useToast } from '../../../components/ui'
import { useProducts, useDeleteProduct } from '../hooks/useProducts'
import ProductFiltersBar from '../components/ProductFiltersBar'
import ProductTable from '../components/ProductTable'
import Pagination from '../../../components/shared/Pagination'
import AddProductDialog from '../components/AddProductDialog'
import EditProductDialog from '../components/EditProductDialog'
import type { Product, ProductFilters, SortField, SortDirection } from '../api/productApi'

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [showAdd, setShowAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const deleteProduct = useDeleteProduct()
  const { toast } = useToast()

  const { data, isLoading, isError } = useProducts({
    filters,
    page,
    perPage,
    sortField,
    sortDir,
  })

  const handleFiltersChange = useCallback((next: ProductFilters) => {
    setFilters(next)
    setPage(1)
  }, [])

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
      setPage(1)
    },
    [sortField],
  )

  const handlePerPageChange = useCallback((next: number) => {
    setPerPage(next)
    setPage(1)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingProduct) return
    try {
      await deleteProduct.mutateAsync(deletingProduct.id)
      toast(`"${deletingProduct.name}" deleted successfully`, 'success')
      setDeletingProduct(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product'
      toast(message, 'error')
    }
  }, [deletingProduct, deleteProduct, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Products</h1>
          <p className="mt-1 text-body text-text-muted">
            Manage your catalog. Click Add Product, then scan a barcode to fill the barcode field.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add Product
        </Button>
      </div>

      <ProductFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        total={data?.total ?? 0}
      />

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger-muted py-16">
          <p className="text-body text-danger">Failed to load products</p>
          <p className="mt-1 text-caption text-text-muted">Please try again later</p>
        </div>
      ) : (
        <>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/60 backdrop-blur-sm">
                <Spinner />
              </div>
            )}
            <ProductTable
              products={data?.data ?? []}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onEdit={setEditingProduct}
              onDelete={setDeletingProduct}
            />
          </div>

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              perPage={perPage}
              total={data.total}
              onPageChange={setPage}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </>
      )}

      <AddProductDialog open={showAdd} onClose={() => setShowAdd(false)} />

      {editingProduct && (
        <EditProductDialog
          open
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      <ConfirmationDialog
        open={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteProduct.isPending}
      />
    </div>
  )
}
