import { useMemo } from 'react'
import { Button, Input } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import { useCartStore, type PaymentMethod } from '../store/cartStore'

const methods: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'MOBILE', label: 'Mobile' },
]

interface Props {
  onPay: () => void
  loading?: boolean
}

export default function PaymentPanel({ onPay, loading }: Props) {
  const { formatCurrency, currencySymbol } = useCurrency()
  const items = useCartStore((s) => s.items)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const amountReceived = useCartStore((s) => s.amountReceived)
  const note = useCartStore((s) => s.note)
  const discount = useCartStore((s) => s.discount)
  const taxRate = useCartStore((s) => s.taxRate)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const setAmountReceived = useCartStore((s) => s.setAmountReceived)
  const setNote = useCartStore((s) => s.setNote)

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const clampedDiscount = Math.min(Math.max(discount, 0), subtotal)
    const taxableAmount = subtotal - clampedDiscount
    const tax = Math.round(taxableAmount * taxRate * 100) / 100
    const total = Math.round((taxableAmount + tax) * 100) / 100
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
    return { subtotal, discount: clampedDiscount, taxRate, tax, total, itemCount }
  }, [items, discount, taxRate])

  const change = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0
    return Math.max(0, Math.round((amountReceived - summary.total) * 100) / 100)
  }, [amountReceived, summary.total, paymentMethod])

  const cashInsufficient = paymentMethod === 'CASH' && amountReceived < summary.total
  const disabled = summary.itemCount === 0
  const showChange = paymentMethod === 'CASH'
  const symbolPad = Math.min(Math.max(currencySymbol.length, 1), 4)

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-overline uppercase tracking-wider text-text-muted">Payment</p>
        <div className="flex rounded-lg border border-border-subtle bg-surface p-1">
          {methods.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setPaymentMethod(m.value)}
              className={`flex-1 rounded-md py-2 text-caption-medium transition-fast ${
                paymentMethod === m.value
                  ? 'bg-accent text-text-inverse shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {showChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="amount-received" className="shrink-0 text-body text-text-secondary">
              Received
            </label>
            <div className="relative w-32">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-caption text-text-muted">
                {currencySymbol}
              </span>
              <Input
                id="amount-received"
                type="number"
                min="0"
                step="0.01"
                value={amountReceived || ''}
                onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
                style={{ paddingLeft: `${0.625 + symbolPad * 0.45}rem` }}
                className="h-9 pr-2 text-right text-body tabular-nums"
                disabled={disabled}
              />
            </div>
          </div>
          {amountReceived > 0 && amountReceived >= summary.total && (
            <div className="flex items-center justify-between gap-3 text-body">
              <span className="shrink-0 text-text-secondary">Change</span>
              <span className="truncate tabular-nums font-medium text-success">{formatCurrency(change)}</span>
            </div>
          )}
          {amountReceived > 0 && amountReceived < summary.total && (
            <p className="text-right text-caption text-warning">
              Short by {formatCurrency(summary.total - amountReceived)}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="sale-note" className="sr-only">Note</label>
        <input
          id="sale-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-body text-text-primary placeholder:text-text-muted transition-default focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        />
      </div>

      <div className="space-y-2 pt-1">
        <Button
          className="w-full h-12 text-body-medium"
          disabled={disabled || cashInsufficient}
          loading={loading}
          onClick={onPay}
        >
          {disabled ? 'Add items to pay' : `Pay ${formatCurrency(summary.total)}`}
        </Button>
        <p className="text-center text-overline text-text-muted/60 normal-case tracking-wider">
          F4 to pay
        </p>
      </div>
    </div>
  )
}
