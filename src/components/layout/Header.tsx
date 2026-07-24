import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { applyTheme, fetchSettings, updateSettings } from '../../features/settings/api/settingsApi'
import { useAuth } from '../../features/auth/AuthContext'
import { IPC } from '../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../lib/ipc'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/checkout': 'Checkout',
  '/sales': 'Sales',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/reports': 'Reports',
  '/settings': 'Profile & Settings',
}

interface StoreRow {
  id: string
  name: string
  code: string
}

interface SyncStatus {
  online: boolean
  configured: boolean
  pendingCount: number
  lastSyncAt: string | null
  lastError: string | null
  syncing: boolean
}

async function fetchStores(): Promise<StoreRow[]> {
  if (!isElectron()) return []
  return ipcInvoke<StoreRow[]>(IPC.STORE_LIST)
}

async function fetchActiveStore(): Promise<StoreRow | null> {
  if (!isElectron()) return null
  return ipcInvoke<StoreRow>(IPC.STORE_GET_ACTIVE)
}

async function fetchSyncStatus(): Promise<SyncStatus> {
  if (!isElectron()) {
    return {
      online: false,
      configured: false,
      pendingCount: 0,
      lastSyncAt: null,
      lastError: null,
      syncing: false,
    }
  }
  return ipcInvoke<SyncStatus>(IPC.SYNC_STATUS)
}

export default function Header() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Page'
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: fetchStores })
  const { data: activeStore } = useQuery({ queryKey: ['stores', 'active'], queryFn: fetchActiveStore })
  const { data: syncStatus, refetch: refetchSync } = useQuery({
    queryKey: ['sync', 'status'],
    queryFn: fetchSyncStatus,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    void fetchSettings()
      .then((s) => {
        const t = (s.theme === 'light' || s.theme === 'system' ? s.theme : 'dark') as 'dark' | 'light' | 'system'
        setTheme(t)
        applyTheme(t)
      })
      .catch(() => applyTheme('dark'))
  }, [])

  const cycleTheme = useCallback(async () => {
    const order: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system']
    const next = order[(order.indexOf(theme) + 1) % order.length]!
    setTheme(next)
    applyTheme(next)
    try {
      await updateSettings({ theme: next })
    } catch {
      // theme still applied locally
    }
  }, [theme])

  const onStoreChange = useCallback(async (storeId: string) => {
    if (!isElectron()) return
    await ipcInvoke(IPC.STORE_SET_ACTIVE, storeId)
    await queryClient.invalidateQueries({ queryKey: ['stores', 'active'] })
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    await queryClient.invalidateQueries({ queryKey: ['inventory'] })
    await queryClient.invalidateQueries({ queryKey: ['sales'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }, [queryClient])

  const onSyncNow = useCallback(async () => {
    if (!isElectron()) return
    await ipcInvoke(IPC.SYNC_NOW)
    await refetchSync()
  }, [refetchSync])

  const onLogout = useCallback(async () => {
    await logout()
  }, [logout])

  const themeLabel = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'
  const syncLabel = !syncStatus?.configured
    ? 'Local only'
    : syncStatus.syncing
      ? 'Syncing…'
      : syncStatus.pendingCount > 0
        ? `${syncStatus.pendingCount} pending`
        : syncStatus.online
          ? 'Synced'
          : 'Offline'

  return (
    <header className="sticky top-0 z-sticky flex h-14 items-center justify-between border-b border-border-subtle bg-surface/80 px-6 backdrop-blur-md">
      <h1 className="text-body-medium text-text-primary">{title}</h1>

      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden max-w-[12rem] truncate text-right sm:block">
            <p className="truncate text-caption-medium text-text-primary">{user.name}</p>
            <p className="truncate text-caption text-text-muted">{user.role}</p>
          </div>
        )}

        {stores.length > 0 && (
          <select
            aria-label="Active store"
            className="h-9 max-w-[10rem] rounded-md border border-border-subtle bg-surface px-2 text-caption text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={activeStore?.id ?? ''}
            onChange={(e) => void onStoreChange(e.target.value)}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => void onSyncNow()}
          className="flex h-9 items-center gap-2 rounded-md border border-border-subtle px-3 text-caption-medium text-text-secondary transition-default transition-colors hover:bg-surface-raised hover:text-text-primary"
          title={syncStatus?.lastError || 'Synchronize with cloud'}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              !syncStatus?.configured
                ? 'bg-text-muted'
                : syncStatus.pendingCount > 0
                  ? 'bg-warning'
                  : syncStatus.online
                    ? 'bg-success'
                    : 'bg-danger'
            }`}
          />
          <span className="hidden sm:inline">{syncLabel}</span>
          <span className="sm:hidden">Sync</span>
        </button>

        <button
          type="button"
          onClick={() => void cycleTheme()}
          className="flex h-9 items-center gap-2 rounded-md border border-border-subtle px-3 text-caption-medium text-text-secondary transition-default transition-colors hover:bg-surface-raised hover:text-text-primary"
          aria-label={`Theme: ${themeLabel}. Click to change.`}
          title="Toggle dark / light / system theme"
        >
          {theme === 'light' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : theme === 'system' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
          <span className="hidden sm:inline">{themeLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="flex h-9 items-center gap-2 rounded-md border border-border-subtle px-3 text-caption-medium text-text-secondary transition-default transition-colors hover:bg-surface-raised hover:text-text-primary"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
