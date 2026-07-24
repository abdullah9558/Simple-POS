import { useQuery } from '@tanstack/react-query'
import {
  fetchDailySales,
  fetchWeeklySales,
  fetchMonthlySales,
  fetchProfitReport,
  fetchInventoryReport,
  fetchFastMovingProducts,
  fetchSlowMovingProducts,
} from '../api/reportApi'

export function useDailySales(days = 14) {
  return useQuery({ queryKey: ['reports', 'daily', days], queryFn: () => fetchDailySales(days) })
}

export function useWeeklySales(weeks = 8) {
  return useQuery({ queryKey: ['reports', 'weekly', weeks], queryFn: () => fetchWeeklySales(weeks) })
}

export function useMonthlySales(months = 6) {
  return useQuery({ queryKey: ['reports', 'monthly', months], queryFn: () => fetchMonthlySales(months) })
}

export function useProfitReport(days = 30) {
  return useQuery({ queryKey: ['reports', 'profit', days], queryFn: () => fetchProfitReport(days) })
}

export function useInventoryReport() {
  return useQuery({ queryKey: ['reports', 'inventory'], queryFn: fetchInventoryReport })
}

export function useFastMovingProducts(limit = 10) {
  return useQuery({ queryKey: ['reports', 'fast', limit], queryFn: () => fetchFastMovingProducts(limit) })
}

export function useSlowMovingProducts(limit = 10) {
  return useQuery({ queryKey: ['reports', 'slow', limit], queryFn: () => fetchSlowMovingProducts(limit) })
}
