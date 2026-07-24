import { useState, useCallback } from 'react'
import { Button, Spinner, ConfirmationDialog, useToast } from '../../../components/ui'
import PageHeader from '../../../components/shared/PageHeader'
import Pagination from '../../../components/shared/Pagination'
import { useCustomers, useDeleteCustomer } from '../hooks/useCustomers'
import CustomerFiltersBar from '../components/CustomerFiltersBar'
import CustomerTable from '../components/CustomerTable'
import AddCustomerDialog from '../components/AddCustomerDialog'
import EditCustomerDialog from '../components/EditCustomerDialog'
import CustomerDetailModal from '../components/CustomerDetailModal'
import type { Customer, CustomerFilters, CustomerSortField } from '../api/customerApi'
import type { SortDirection } from '../../../shared/types'

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortField, setSortField] = useState<CustomerSortField>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [showAdd, setShowAdd] = useState(false)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

  const { toast } = useToast()
  const deleteMutation = useDeleteCustomer()
  const { data, isLoading, isError, error, refetch } = useCustomers({ filters, page, perPage, sortField, sortDir })

  const handleSort = useCallback((field: CustomerSortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }, [sortField])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCustomer) return
    try {
      await deleteMutation.mutateAsync(deletingCustomer.id)
      toast(`"${deletingCustomer.name}" deleted`, 'success')
      setDeletingCustomer(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }, [deletingCustomer, deleteMutation, toast])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customers, balances, and purchase history"
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            Add Customer
          </Button>
        }
      />

      <CustomerFiltersBar filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} total={data?.total ?? 0} />

      {isLoading && !data ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger-muted py-16">
          <p className="text-body text-danger">Failed to load customers</p>
          <p className="mt-1 max-w-md text-center text-caption text-text-muted">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/60 backdrop-blur-sm"><Spinner /></div>
            )}
            <CustomerTable
              customers={data?.data ?? []}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onView={setViewingCustomer}
              onEdit={setEditingCustomer}
              onDelete={setDeletingCustomer}
            />
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} perPage={perPage} total={data.total}
              onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1) }} />
          )}
        </>
      )}

      <AddCustomerDialog open={showAdd} onClose={() => setShowAdd(false)} />
      {editingCustomer && <EditCustomerDialog open customer={editingCustomer} onClose={() => setEditingCustomer(null)} />}
      <CustomerDetailModal open={viewingCustomer !== null} customer={viewingCustomer} onClose={() => setViewingCustomer(null)} />

      <ConfirmationDialog open={deletingCustomer !== null} onClose={() => setDeletingCustomer(null)} onConfirm={handleDeleteConfirm}
        title="Delete Customer" description={`Delete "${deletingCustomer?.name}"? This cannot be undone.`}
        confirmLabel="Delete" variant="danger" loading={deleteMutation.isPending} />
    </div>
  )
}
