import { createContext, useContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
