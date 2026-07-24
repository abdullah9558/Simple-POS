import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completeSale } from '../api/checkoutApi'
import type { CompleteSaleInput } from '../schemas/checkoutSchema'

export function useCompleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CompleteSaleInput) => completeSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
