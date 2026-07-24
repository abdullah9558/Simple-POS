import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllCategories,
  fetchCategoryDropdown,
  addCategory,
  updateCategory,
  deleteCategory,
  type CategoryQuery,
} from '../api/categoryApi'
import type { CategoryFormData } from '../schemas/categorySchema'

export function useCategoryList(query: CategoryQuery) {
  return useQuery({
    queryKey: ['categories', 'list', query],
    queryFn: () => fetchAllCategories(query),
  })
}

export function useCategoryDropdown() {
  return useQuery({
    queryKey: ['categories', 'dropdown'],
    queryFn: fetchCategoryDropdown,
    staleTime: Infinity,
  })
}

export function useAddCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryFormData) =>
      addCategory({ name: data.name, description: data.description ?? '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useEditCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      updateCategory(id, { name: data.name, description: data.description ?? '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
