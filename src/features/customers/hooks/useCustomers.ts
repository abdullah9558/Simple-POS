import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  fetchCustomers,
  fetchCustomerById,
  fetchPurchaseHistory,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerQuery,
} from '../api/customerApi'
import type { CustomerFormData } from '../schemas/customerSchema'

export function useCustomers(query: CustomerQuery) {
  return useQuery({
    queryKey: ['customers', query],
    queryFn: () => fetchCustomers(query),
    placeholderData: keepPreviousData,
  })
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => fetchCustomerById(id!),
    enabled: !!id,
  })
}

export function usePurchaseHistory(id: string | null) {
  return useQuery({
    queryKey: ['customers', id, 'history'],
    queryFn: () => fetchPurchaseHistory(id!),
    enabled: !!id,
  })
}

export function useAddCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomerFormData) => addCustomer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) => updateCustomer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
