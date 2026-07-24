import { useMemo } from 'react'
import { Input } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import { useCartStore } from '../store/cartStore'

export default function OrderSummary() {
  const { formatCurrency, currencySymbol } = useCurrency()
  const items = useCartStore((s) => s.items)
  const discount = useCartStore((s) => s.discount)
  const taxRate = useCartStore((s) => s.taxRate)
  const setDiscount = useCartStore((s) => s.setDiscount)

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const clampedDiscount = Math.min(Math.max(discount, 0), subtotal)
    const taxableAmount = subtotal - clampedDiscount
    const tax = Math.round(taxableAmount * taxRate * 100) / 100
    const total = Math.round((taxableAmount + tax) * 100) / 100
    return { subtotal, discount: clampedDiscount, taxRate, tax, total }
  }, [items, discount, taxRate])

  const symbolPad = Math.min(Math.max(currencySymbol.length, 1), 4)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-overline uppercase tracking-wider text-text-muted">Order</p>
        <p className="mt-2 break-all text-display tabular-nums tracking-tight text-text-primary">
          {formatCurrency(summary.total)}
        </p>
      </div>

      <dl className="space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-body text-text-secondary">
          <dt className="shrink-0">Subtotal</dt>
          <dd className="truncate tabular-nums text-text-primary">{formatCurrency(summary.subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between gap-3 text-body text-text-secondary">
          <dt className="shrink-0">Discount</dt>
          <dd className="relative w-28">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-caption text-text-muted">
              {currencySymbol}
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              style={{ paddingLeft: `${0.625 + symbolPad * 0.45}rem` }}
              className="h-8 pr-2 text-right text-caption tabular-nums"
              aria-label="Discount amount"
            />
          </dd>
        </div>

        {summary.discount > 0 && (
          <div className="flex items-center justify-between gap-3 text-caption text-success">
            <dt className="shrink-0">Applied</dt>
            <dd className="truncate tabular-nums">-{formatCurrency(summary.discount)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-body text-text-secondary">
          <dt className="shrink-0">Tax ({(summary.taxRate * 100).toFixed(0)}%)</dt>
          <dd className="truncate tabular-nums text-text-primary">{formatCurrency(summary.tax)}</dd>
        </div>
      </dl>
    </div>
  )
}
