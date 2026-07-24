import { type ReactNode, useCallback, useState } from 'react'
import { ToastContext, type ToastVariant } from './toastContext'

interface ToastMessage {
  id: number
  variant: ToastVariant
  message: string
}

let toastIdCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev, { id, variant, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-toast flex flex-col-reverse gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-success/30 text-success',
  error:   'border-danger/30 text-danger',
  warning: 'border-warning/30 text-warning',
  info:    'border-border-subtle text-text-primary',
}

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  return (
    <div
      className={`flex min-w-[300px] max-w-sm items-center gap-3 rounded-lg border bg-surface-raised px-4 py-3 shadow-lg ${variantStyles[toast.variant]}`}
    >
      <span className="shrink-0">{variantIcons[toast.variant]}</span>
      <p className="flex-1 text-body">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-text-muted transition-fast transition-colors hover:text-text-primary"
        aria-label="Dismiss"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
