import { useEffect, useRef, useCallback } from 'react'

export interface BarcodeScannerOptions {
  /** Max ms between keystrokes to treat as scanner input (USB keyboard wedge). */
  maxKeyIntervalMs?: number
  /** Minimum barcode length before lookup. */
  minLength?: number
  /** Characters that finalize a scan (typical scanners send Enter). */
  terminators?: string[]
  enabled?: boolean
  onScan: (code: string) => void
}

/**
 * USB barcode scanners that emulate a keyboard type rapidly then send Enter.
 * This hook buffers characters when keystroke timing looks like a wedge scanner,
 * including when focus is not on a dedicated input.
 */
export function useBarcodeScanner({
  maxKeyIntervalMs = 50,
  minLength = 4,
  terminators = ['Enter'],
  enabled = true,
  onScan,
}: BarcodeScannerOptions) {
  const bufferRef = useRef('')
  const lastKeyAtRef = useRef(0)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const reset = useCallback(() => {
    bufferRef.current = ''
    lastKeyAtRef.current = 0
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable

      // Allow Enter terminator even inside search input; skip other fields for typing.
      if (isEditable && tag !== 'input' && !terminators.includes(e.key)) {
        return
      }

      // Ignore shortcuts / modifiers
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const now = performance.now()
      const elapsed = now - lastKeyAtRef.current

      if (terminators.includes(e.key)) {
        const code = bufferRef.current.trim()
        if (code.length >= minLength && (elapsed <= maxKeyIntervalMs * 3 || bufferRef.current.length >= minLength)) {
          // Only intercept when buffer looks like a scan (rapid keys) OR pure barcode digits/alphanumeric
          const rapid = bufferRef.current.length >= minLength && elapsed <= maxKeyIntervalMs * 4
          const barcodeLike = /^[A-Za-z0-9\-._]+$/.test(code) && code.length >= minLength
          if (rapid || (barcodeLike && !isEditable)) {
            e.preventDefault()
            e.stopPropagation()
            reset()
            onScanRef.current(code)
            return
          }
        }
        reset()
        return
      }

      if (e.key.length !== 1) return

      if (lastKeyAtRef.current && elapsed > maxKeyIntervalMs * 8) {
        bufferRef.current = ''
      }

      bufferRef.current += e.key
      lastKeyAtRef.current = now

      // Cap buffer
      if (bufferRef.current.length > 64) {
        bufferRef.current = bufferRef.current.slice(-64)
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [enabled, maxKeyIntervalMs, minLength, terminators, reset])

  return { reset }
}
