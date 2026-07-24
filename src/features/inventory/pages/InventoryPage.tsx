import { useState, useCallback } from 'react'
import { Button, Spinner, Search, ConfirmationDialog, useToast } from '../../../components/ui'
import PageHeader from '../../../components/shared/PageHeader'
import Tabs from '../../../components/shared/Tabs'
import Pagination from '../../../components/shared/Pagination'
import InventoryDashboard from '../components/InventoryDashboard'
import StockFiltersBar from '../components/StockFiltersBar'
import StockTable from '../components/StockTable'
import MovementTable from '../components/MovementTable'
import StockAdjustmentDialog from '../components/StockAdjustmentDialog'
import SupplierTable from '../components/SupplierTable'
import AddSupplierDialog from '../components/AddSupplierDialog'
import EditSupplierDialog from '../components/EditSupplierDialog'
import PurchaseOrderTable from '../components/PurchaseOrderTable'
import CreatePurchaseOrderDialog from '../components/CreatePurchaseOrderDialog'
import ReceiveStockDialog from '../components/ReceiveStockDialog'
import {
  useStockSummary,
  useStock,
  useMovements,
  useSuppliers,
  useDeleteSupplier,
  usePurchaseOrders,
  useCancelPurchaseOrder,
} from '../hooks/useInventory'
import type { Product } from '../../products/api/productApi'
import type { Supplier, PurchaseOrder, StockFilters, StockSortField, MovementFilters, SupplierFilters, PurchaseOrderFilters } from '../api/inventoryApi'
import type { SortDirection } from '../../../shared/types'

type TabId = 'dashboard' | 'stock' | 'movements' | 'suppliers' | 'orders'

export default function InventoryPage() {
  const [tab, setTab] = useState<TabId>('dashboard')

  // Stock state
  const [stockFilters, setStockFilters] = useState<StockFilters>({})
  const [stockPage, setStockPage] = useState(1)
  const [stockPerPage, setStockPerPage] = useState(10)
  const [stockSortField, setStockSortField] = useState<StockSortField>('name')
  const [stockSortDir, setStockSortDir] = useState<SortDirection>('asc')
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)

  // Movement state
  const [movementFilters, setMovementFilters] = useState<MovementFilters>({})
  const [movementPage, setMovementPage] = useState(1)
  const [movementPerPage, setMovementPerPage] = useState(10)

  // Supplier state
  const [supplierFilters, setSupplierFilters] = useState<SupplierFilters>({})
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  // PO state
  const [poFilters, setPoFilters] = useState<PurchaseOrderFilters>({})
  const [showCreatePO, setShowCreatePO] = useState(false)
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState<PurchaseOrder | null>(null)

  const { toast } = useToast()
  const { data: summary } = useStockSummary()
  const { data: stockData, isLoading: stockLoading } = useStock({ filters: stockFilters, page: stockPage, perPage: stockPerPage, sortField: stockSortField, sortDir: stockSortDir })
  const { data: movementData, isLoading: movementLoading } = useMovements(movementFilters, movementPage, movementPerPage)
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers(supplierFilters)
  const { data: orders = [], isLoading: ordersLoading } = usePurchaseOrders(poFilters)
  const deleteSupplier = useDeleteSupplier()
  const cancelPO = useCancelPurchaseOrder()

  const handleStockSort = useCallback((field: StockSortField) => {
    if (field === stockSortField) setStockSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setStockSortField(field); setStockSortDir('asc') }
    setStockPage(1)
  }, [stockSortField])

  const handleAdjust = useCallback((product: Product | null) => {
    setAdjustingProduct(product)
    setShowAdjust(true)
  }, [])

  const handleDeleteSupplier = useCallback(async () => {
    if (!deletingSupplier) return
    try {
      await deleteSupplier.mutateAsync(deletingSupplier.id)
      toast(`"${deletingSupplier.name}" deleted`, 'success')
      setDeletingSupplier(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }, [deletingSupplier, deleteSupplier, toast])

  const handleCancelPO = useCallback(async () => {
    if (!cancellingOrder) return
    try {
      await cancelPO.mutateAsync(cancellingOrder.id)
      toast(`${cancellingOrder.orderNo} cancelled`, 'success')
      setCancellingOrder(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Cancel failed', 'error')
    }
  }, [cancellingOrder, cancelPO, toast])

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'stock' as const, label: 'Stock', count: summary?.totalProducts },
    { id: 'movements' as const, label: 'Movements' },
    { id: 'suppliers' as const, label: 'Suppliers', count: suppliers.length },
    { id: 'orders' as const, label: 'Purchase Orders', count: orders.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage stock levels, suppliers, and purchase orders"
        actions={
          tab === 'stock' ? (
            <Button onClick={() => handleAdjust(null)}>Adjust Stock</Button>
          ) : tab === 'suppliers' ? (
            <Button onClick={() => setShowAddSupplier(true)}>Add Supplier</Button>
          ) : tab === 'orders' ? (
            <Button onClick={() => setShowCreatePO(true)}>Create Order</Button>
          ) : undefined
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'dashboard' && summary && (
        <InventoryDashboard {...summary} />
      )}

      {tab === 'stock' && (
        <div className="space-y-4">
          <StockFiltersBar filters={stockFilters} onChange={(f) => { setStockFilters(f); setStockPage(1) }} total={stockData?.total ?? 0} />
          {stockLoading && !stockData ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
            <>
              <StockTable products={stockData?.data ?? []} sortField={stockSortField} sortDir={stockSortDir} onSort={handleStockSort} onAdjust={handleAdjust} />
              {stockData && <Pagination page={stockData.page} totalPages={stockData.totalPages} perPage={stockPerPage} total={stockData.total} onPageChange={setStockPage} onPerPageChange={(n) => { setStockPerPage(n); setStockPage(1) }} />}
            </>
          )}
        </div>
      )}

      {tab === 'movements' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
            <Search placeholder="Search product or reference..." value={movementFilters.search ?? ''} onChange={(e) => { setMovementFilters({ ...movementFilters, search: e.currentTarget.value || undefined }); setMovementPage(1) }} className="w-full sm:w-64" />
            <select value={movementFilters.type ?? 'all'} onChange={(e) => { setMovementFilters({ ...movementFilters, type: e.target.value as MovementFilters['type'] }); setMovementPage(1) }}
              className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption focus:outline-none focus:ring-2 focus:ring-accent/50">
              <option value="all">All Types</option>
              <option value="IN">In</option>
              <option value="OUT">Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="RETURN">Return</option>
            </select>
          </div>
          {movementLoading ? <div className="flex justify-center py-20"><Spinner /></div> : (
            <>
              <MovementTable movements={movementData?.data ?? []} />
              {movementData && <Pagination page={movementData.page} totalPages={movementData.totalPages} perPage={movementPerPage} total={movementData.total} onPageChange={setMovementPage} onPerPageChange={(n) => { setMovementPerPage(n); setMovementPage(1) }} />}
            </>
          )}
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
            <Search placeholder="Search suppliers..." value={supplierFilters.search ?? ''} onChange={(e) => setSupplierFilters({ ...supplierFilters, search: e.currentTarget.value || undefined })} className="w-full sm:w-64" />
            <select value={supplierFilters.status ?? 'all'} onChange={(e) => setSupplierFilters({ ...supplierFilters, status: e.target.value as SupplierFilters['status'] })}
              className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption focus:outline-none focus:ring-2 focus:ring-accent/50">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {suppliersLoading ? <div className="flex justify-center py-20"><Spinner /></div> : (
            <SupplierTable suppliers={suppliers} onEdit={setEditingSupplier} onDelete={setDeletingSupplier} />
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
            <Search placeholder="Search orders..." value={poFilters.search ?? ''} onChange={(e) => setPoFilters({ ...poFilters, search: e.currentTarget.value || undefined })} className="w-full sm:w-64" />
            <select value={poFilters.status ?? 'all'} onChange={(e) => setPoFilters({ ...poFilters, status: e.target.value as PurchaseOrderFilters['status'] })}
              className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-caption focus:outline-none focus:ring-2 focus:ring-accent/50">
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {ordersLoading ? <div className="flex justify-center py-20"><Spinner /></div> : (
            <PurchaseOrderTable orders={orders} onReceive={setReceivingOrder} onCancel={setCancellingOrder} />
          )}
        </div>
      )}

      <StockAdjustmentDialog open={showAdjust} product={adjustingProduct} onClose={() => { setShowAdjust(false); setAdjustingProduct(null) }} />
      <AddSupplierDialog open={showAddSupplier} onClose={() => setShowAddSupplier(false)} />
      {editingSupplier && <EditSupplierDialog open supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />}
      <CreatePurchaseOrderDialog open={showCreatePO} onClose={() => setShowCreatePO(false)} />
      <ReceiveStockDialog open={receivingOrder !== null} order={receivingOrder} onClose={() => setReceivingOrder(null)} />

      <ConfirmationDialog open={deletingSupplier !== null} onClose={() => setDeletingSupplier(null)} onConfirm={handleDeleteSupplier}
        title="Delete Supplier" description={`Delete "${deletingSupplier?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" loading={deleteSupplier.isPending} />

      <ConfirmationDialog open={cancellingOrder !== null} onClose={() => setCancellingOrder(null)} onConfirm={handleCancelPO}
        title="Cancel Order" description={`Cancel ${cancellingOrder?.orderNo}?`} confirmLabel="Cancel Order" variant="danger" loading={cancelPO.isPending} />
    </div>
  )
}
