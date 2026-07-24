import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSettings,
  updateSettings,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchDatabaseInfo,
  backupDatabase,
  restoreDatabase,
  applyTheme,
  type UserFilters,
} from '../api/settingsApi'
import type { AppSettings } from '../../../shared/settings'
import type { UserFormData } from '../schemas/settingsSchema'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 30_000,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: Partial<AppSettings>) => updateSettings(settings),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (data.theme) applyTheme(data.theme)
    },
  })
}

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => fetchUsers(filters),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UserFormData & { password: string }) =>
      createUser({ name: data.name, email: data.email, password: data.password, role: data.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormData }) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      }
      if (data.password) payload.password = data.password
      return updateUser(id, payload)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDatabaseInfo() {
  return useQuery({
    queryKey: ['database', 'info'],
    queryFn: fetchDatabaseInfo,
    enabled: false,
  })
}

export function useBackupDatabase() {
  return useMutation({ mutationFn: backupDatabase })
}

export function useRestoreDatabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: restoreDatabase,
    onSuccess: () => {
      qc.invalidateQueries()
    },
  })
}
