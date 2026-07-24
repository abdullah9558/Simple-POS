import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Badge, useToast } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import { useCartStore } from '../store/cartStore'
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner'
import { lookupProductByBarcode, searchProductsLocal, type LookupProduct } from '../api/productLookupApi'

const BARCODE_REGEX = /^[A-Za-z0-9\-._]{4,32}$/
const DEBOUNCE_MS = 150

function toCartProduct(product: LookupProduct) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
  }
}

export default function ProductSearch() {
  const addItem = useCartStore((s) => s.addItem)
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [rawQuery, setRawQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [scanFlash, setScanFlash] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const lookupInFlight = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const selectProduct = useCallback(
    (product: LookupProduct) => {
      if (!product.isActive || product.stock <= 0) {
        toast(`${product.name} is out of stock`, 'error')
        return
      }
      addItem(toCartProduct(product))
      setRawQuery('')
      setDebouncedQuery('')
      setActiveIndex(-1)
      setScanFlash(true)
      window.setTimeout(() => setScanFlash(false), 400)
      inputRef.current?.focus()
    },
    [addItem, toast],
  )

  const tryBarcodeLookup = useCallback(
    async (code: string) => {
      if (lookupInFlight.current) return
      lookupInFlight.current = true
      try {
        const product = await lookupProductByBarcode(code)
        if (product) {
          selectProduct(product)
          return true
        }
        toast(`No product for barcode ${code}. Add it under Products first.`, 'error')
        return false
      } finally {
        lookupInFlight.current = false
      }
    },
    [selectProduct, toast],
  )

  // Global USB keyboard-wedge scanner
  useBarcodeScanner({
    enabled: true,
    minLength: 4,
    onScan: (code) => {
      void tryBarcodeLookup(code)
    },
  })

  const handleQueryChange = useCallback((value: string) => {
    setRawQuery(value)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = value.trim()
    if (BARCODE_REGEX.test(trimmed) && /^\d{8,14}$/.test(trimmed)) {
      void tryBarcodeLookup(trimmed)
      return
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
    }, DEBOUNCE_MS)
  }, [tryBarcodeLookup])

  const [results, setResults] = useState<LookupProduct[]>([])

  useEffect(() => {
    let cancelled = false
    void searchProductsLocal(debouncedQuery).then((rows) => {
      if (!cancelled) setResults(rows)
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const selectableResults = useMemo(
    () => results.filter((p) => p.stock > 0),
    [results],
  )

  useEffect(() => {
    if (activeIndex < 0 || !gridRef.current) return
    const items = gridRef.current.querySelectorAll<HTMLElement>('[data-selectable]')
    items[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = selectableResults.length

      if (e.key === 'Enter' && rawQuery.trim() && BARCODE_REGEX.test(rawQuery.trim())) {
        e.preventDefault()
        void tryBarcodeLookup(rawQuery.trim())
        return
      }

      if (count === 0) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const cols = getGridCols()
          setActiveIndex((prev) => {
            const next = prev + cols
            return next < count ? next : prev
          })
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const cols = getGridCols()
          setActiveIndex((prev) => {
            const next = prev - cols
            return next >= 0 ? next : prev
          })
          break
        }
        case 'ArrowRight':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1 < count ? prev + 1 : prev))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev))
          break
        case 'Enter': {
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < count) {
            selectProduct(selectableResults[activeIndex])
          } else if (count === 1) {
            selectProduct(selectableResults[0])
          }
          break
        }
        case 'Escape':
          if (rawQuery) {
            e.preventDefault()
            setRawQuery('')
            setDebouncedQuery('')
            setActiveIndex(-1)
          }
          break
      }
    },
    [selectableResults, activeIndex, selectProduct, rawQuery, tryBarcodeLookup],
  )

  function getGridCols(): number {
    if (!gridRef.current) return 2
    const style = getComputedStyle(gridRef.current)
    return style.gridTemplateColumns.split(' ').length
  }

  const selectableIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    selectableResults.forEach((p, i) => map.set(p.id, i))
    return map
  }, [selectableResults])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className={`shrink-0 border-b border-border-subtle px-5 py-4 transition-colors ${scanFlash ? 'bg-accent/10' : ''}`}>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={rawQuery}
            onChange={(e) => handleQueryChange(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or scan… (F2)"
            className="h-10 w-full rounded-md border border-border-subtle bg-surface-raised pl-9 pr-16 text-body text-text-primary placeholder:text-text-muted transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            autoComplete="off"
            spellCheck={false}
            data-barcode-input="true"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {rawQuery && (
              <button
                type="button"
                className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-sm text-text-muted transition-fast hover:text-text-primary"
                onClick={() => {
                  setRawQuery('')
                  setDebouncedQuery('')
                  setActiveIndex(-1)
                  inputRef.current?.focus()
                }}
                aria-label="Clear"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border-subtle bg-surface-inset px-1.5 text-[10px] font-medium text-text-muted">
              F2
            </kbd>
          </div>
        </div>
        {debouncedQuery.trim() && (
          <p className="mt-2.5 text-caption text-text-muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-styled p-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <p className="text-body">No products found</p>
            <p className="mt-1 text-caption text-text-muted/70">Try a name, SKU, or barcode</p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            role="listbox"
            aria-label="Product results"
          >
            {results.map((product) => {
              const outOfStock = product.stock <= 0
              const selectableIdx = selectableIndexMap.get(product.id)
              const isActive = selectableIdx !== undefined && selectableIdx === activeIndex

              return (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  disabled={outOfStock}
                  data-selectable={outOfStock ? undefined : true}
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => {
                    if (selectableIdx !== undefined) setActiveIndex(selectableIdx)
                  }}
                  className={`group flex flex-col rounded-lg border px-3 py-3 text-left transition-fast ${
                    outOfStock
                      ? 'cursor-not-allowed border-border-subtle/50 opacity-40'
                      : isActive
                        ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                        : 'border-border-subtle hover:border-accent/40 hover:bg-accent/5 active:scale-[0.98]'
                  }`}
                >
                  <span className={`text-body-medium line-clamp-2 ${isActive ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>
                    {product.name}
                  </span>
                  <span className="mt-1 font-mono text-overline text-text-muted normal-case tracking-normal">{product.sku}</span>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-body-medium tabular-nums text-accent">{formatCurrency(product.price)}</span>
                    {outOfStock ? (
                      <Badge variant="danger">Out</Badge>
                    ) : product.stock <= product.minStock ? (
                      <Badge variant="warning">{product.stock}</Badge>
                    ) : (
                      <span className="text-caption tabular-nums text-text-muted">{product.stock}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
