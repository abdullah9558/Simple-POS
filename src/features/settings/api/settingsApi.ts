import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import type { AppSettings } from '../../../shared/settings'
import { DEFAULT_SETTINGS } from '../../../shared/settings'

export interface SafeUser {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER'
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: { sales: number }
}

export interface DatabaseInfo {
  path: string
  sizeBytes: number
  sizeFormatted: string
  tableCounts: Record<string, number>
  lastModified: string
}

const STORAGE_KEY = 'pos-settings-fallback'

function getFallback(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppSettings
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function saveFallback(settings: Partial<AppSettings>) {
  const current = getFallback()
  const merged = { ...current, ...settings }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return merged
}

export async function fetchSettings(): Promise<AppSettings> {
  if (isElectron()) return ipcInvoke<AppSettings>(IPC.SETTINGS_GET_ALL)
  return getFallback()
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  if (isElectron()) return ipcInvoke<AppSettings>(IPC.SETTINGS_UPDATE_ALL, settings)
  return saveFallback(settings)
}

export interface UserFilters {
  search?: string
  role?: string
}

export async function fetchUsers(filters?: UserFilters): Promise<SafeUser[]> {
  if (!isElectron()) return []
  return ipcInvoke<SafeUser[]>(IPC.USER_GET_ALL, filters)
}

export async function createUser(input: { name: string; email: string; password: string; role: string }) {
  if (!isElectron()) throw new Error('User management requires the Electron app')
  return ipcInvoke<SafeUser>(IPC.USER_CREATE, input)
}

export async function updateUser(id: string, input: Record<string, unknown>) {
  if (!isElectron()) throw new Error('User management requires the Electron app')
  return ipcInvoke<SafeUser>(IPC.USER_UPDATE, id, input)
}

export async function deleteUser(id: string) {
  if (!isElectron()) throw new Error('User management requires the Electron app')
  return ipcInvoke<void>(IPC.USER_DELETE, id)
}

export async function fetchDatabaseInfo(): Promise<DatabaseInfo> {
  if (!isElectron()) {
    return {
      path: '(browser)',
      sizeBytes: 0,
      sizeFormatted: '0 B',
      tableCounts: {},
      lastModified: new Date().toISOString(),
    }
  }
  return ipcInvoke<DatabaseInfo>(IPC.DB_INFO)
}

export async function backupDatabase(): Promise<string | null> {
  if (!isElectron()) throw new Error('Database backup requires the Electron app')
  return ipcInvoke<string | null>(IPC.DB_BACKUP)
}

export async function restoreDatabase(): Promise<boolean> {
  if (!isElectron()) throw new Error('Database restore requires the Electron app')
  return ipcInvoke<boolean>(IPC.DB_RESTORE)
}

export function applyTheme(theme: string) {
  const root = document.documentElement
  root.setAttribute('data-theme-preference', theme)

  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme === 'light'
        ? 'light'
        : 'dark'

  root.setAttribute('data-theme', resolved)
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
}
