import { useState, useCallback } from 'react'
import { Spinner, ConfirmationDialog, useToast } from '../../../components/ui'
import PageHeader from '../../../components/shared/PageHeader'
import Pagination from '../../../components/shared/Pagination'
import { useCurrency } from '../../../hooks/useCurrency'
import { useSales, useRefundSale } from '../hooks/useSales'
import SaleFiltersBar from '../components/SaleFiltersBar'
import SalesTable from '../components/SalesTable'
import SaleDetailModal from '../components/SaleDetailModal'
import type { Sale, SaleFilters, SaleSortField } from '../api/salesApi'
import type { SortDirection } from '../../../shared/types'

export default function SalesPage() {
  const [filters, setFilters] = useState<SaleFilters>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortField, setSortField] = useState<SaleSortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null)

  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const refundMutation = useRefundSale()
  const { data, isLoading, isError } = useSales({ filters, page, perPage, sortField, sortDir })

  const handleFiltersChange = useCallback((next: SaleFilters) => {
    setFilters(next)
    setPage(1)
  }, [])

  const handleSort = useCallback((field: SaleSortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }, [sortField])

  const handleRefundConfirm = useCallback(async () => {
    if (!refundingSale) return
    try {
      await refundMutation.mutateAsync(refundingSale.id)
      toast(`${refundingSale.invoiceNo} refunded — inventory restored`, 'success')
      setRefundingSale(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Refund failed', 'error')
    }
  }, [refundingSale, refundMutation, toast])

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description="View sales history, invoice details, and process refunds" />

      <SaleFiltersBar filters={filters} onChange={handleFiltersChange} total={data?.total ?? 0} />

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger-muted py-16">
          <p className="text-body text-danger">Failed to load sales</p>
        </div>
      ) : (
        <>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/60 backdrop-blur-sm">
                <Spinner />
              </div>
            )}
            <SalesTable
              sales={data?.data ?? []}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onView={setViewingSale}
              onRefund={setRefundingSale}
            />
          </div>

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              perPage={perPage}
              total={data.total}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
            />
          )}
        </>
      )}

      <SaleDetailModal open={viewingSale !== null} sale={viewingSale} onClose={() => setViewingSale(null)} />

      <ConfirmationDialog
        open={refundingSale !== null}
        onClose={() => setRefundingSale(null)}
        onConfirm={handleRefundConfirm}
        title="Refund Sale"
        description={`Refund ${refundingSale?.invoiceNo} for ${refundingSale ? formatCurrency(refundingSale.total) : ''}? Stock will be restored to inventory.`}
        confirmLabel="Refund"
        variant="danger"
        loading={refundMutation.isPending}
      />
    </div>
  )
}
