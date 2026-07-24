import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { fetchProducts, fetchSuppliers, addProduct, updateProduct, deleteProduct, type ProductQuery } from '../api/productApi'
import type { ProductFormData } from '../schemas/productSchema'

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => fetchProducts(query),
    placeholderData: keepPreviousData,
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
    staleTime: Infinity,
  })
}

export function useAddProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductFormData) => addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useEditProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
