import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { fetchSales, fetchSaleById, refundSale, type SaleQuery } from '../api/salesApi'

export function useSales(query: SaleQuery) {
  return useQuery({
    queryKey: ['sales', query],
    queryFn: () => fetchSales(query),
    placeholderData: keepPreviousData,
  })
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => fetchSaleById(id!),
    enabled: !!id,
  })
}

export function useRefundSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => refundSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
