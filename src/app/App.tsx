import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { Spinner, ToastProvider } from '../components/ui'
import { applyTheme, fetchSettings } from '../features/settings/api/settingsApi'
import { useAuth } from '../features/auth/AuthContext'
import LoginPage from '../features/auth/pages/LoginPage'

export default function App() {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    void fetchSettings()
      .then((s) => {
        queryClient.setQueryData(['settings'], s)
        applyTheme(s.theme || 'dark')
      })
      .catch(() => applyTheme('dark'))

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const saved = document.documentElement.getAttribute('data-theme-preference')
      if (saved === 'system') applyTheme('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [queryClient])

  if (loading) {
    return (
      <ToastProvider>
        <div className="flex h-screen items-center justify-center bg-surface">
          <Spinner size="lg" />
        </div>
      </ToastProvider>
    )
  }

  if (!user) {
    return (
      <ToastProvider>
        <LoginPage />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-surface text-text-primary">
        <Sidebar />
        <div className="ml-sidebar flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-styled page-padding">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
