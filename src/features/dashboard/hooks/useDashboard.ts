import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats, fetchRecentSales } from '../api/dashboardApi'

export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard', 'stats'], queryFn: fetchDashboardStats })
}

export function useRecentSales(limit = 8) {
  return useQuery({ queryKey: ['dashboard', 'recentSales', limit], queryFn: () => fetchRecentSales(limit) })
}
