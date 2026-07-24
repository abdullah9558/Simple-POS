import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  fetchStockSummary,
  fetchStock,
  fetchMovements,
  adjustStock,
  fetchSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  fetchPurchaseOrders,
  createPurchaseOrder,
  receiveStock,
  cancelPurchaseOrder,
  fetchActiveProducts,
  type StockQuery,
  type MovementFilters,
  type SupplierFilters,
  type PurchaseOrderFilters,
} from '../api/inventoryApi'
import type { StockAdjustmentFormData, SupplierFormData, PurchaseOrderFormData } from '../schemas/inventorySchema'

export function useStockSummary() {
  return useQuery({ queryKey: ['inventory', 'summary'], queryFn: fetchStockSummary })
}

export function useStock(query: StockQuery) {
  return useQuery({
    queryKey: ['inventory', 'stock', query],
    queryFn: () => fetchStock(query),
    placeholderData: keepPreviousData,
  })
}

export function useMovements(filters: MovementFilters, page: number, perPage: number) {
  return useQuery({
    queryKey: ['inventory', 'movements', filters, page, perPage],
    queryFn: () => fetchMovements({ filters, page, perPage }),
    placeholderData: keepPreviousData,
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StockAdjustmentFormData) => adjustStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useSuppliers(filters: SupplierFilters = {}) {
  return useQuery({ queryKey: ['suppliers', filters], queryFn: () => fetchSuppliers(filters) })
}

export function useAddSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SupplierFormData) => addSupplier(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierFormData }) => updateSupplier(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function usePurchaseOrders(filters: PurchaseOrderFilters = {}) {
  return useQuery({ queryKey: ['purchaseOrders', filters], queryFn: () => fetchPurchaseOrders(filters) })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PurchaseOrderFormData) => createPurchaseOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] }),
  })
}

export function useReceiveStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, items }: { orderId: string; items: { itemId: string; quantity: number }[] }) =>
      receiveStock(orderId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelPurchaseOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] }),
  })
}

export function useActiveProducts() {
  return useQuery({ queryKey: ['products', 'active'], queryFn: fetchActiveProducts, staleTime: 60_000 })
}
