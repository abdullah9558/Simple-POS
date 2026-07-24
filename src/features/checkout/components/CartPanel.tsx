import { memo, useState } from 'react'
import { Button } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import { useCartStore, type CartItem } from '../store/cartStore'

const QuantityInput = memo(function QuantityInput({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(item.quantity))

  const commitDraft = () => {
    const parsed = parseInt(draft, 10)
    if (!Number.isNaN(parsed) && parsed >= 1) {
      updateQuantity(item.productId, parsed)
    }
    setEditing(false)
  }

  return (
    <div className="inline-flex items-center rounded-md border border-border-subtle">
      <button
        type="button"
        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
        disabled={item.quantity <= 1}
        className="flex h-7 w-7 items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-fast"
        aria-label="Decrease"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" />
        </svg>
      </button>

      {editing ? (
        <input
          autoFocus
          type="number"
          min={1}
          max={item.stock}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="h-7 w-10 border-x border-border-subtle bg-transparent text-center text-caption-medium tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(item.quantity))
            setEditing(true)
          }}
          className="flex h-7 min-w-[2rem] items-center justify-center border-x border-border-subtle text-caption-medium tabular-nums text-text-primary hover:bg-surface-inset transition-fast"
          title="Click to edit quantity"
        >
          {item.quantity}
        </button>
      )}

      <button
        type="button"
        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
        disabled={item.quantity >= item.stock}
        className="flex h-7 w-7 items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-fast"
        aria-label="Increase"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>
    </div>
  )
})

export default function CartPanel() {
  const { formatCurrency } = useCurrency()
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden" aria-labelledby="current-sale-title">
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
        <div className="min-w-0">
          <h2 id="current-sale-title" className="text-subheading text-text-primary">Current sale</h2>
          <p className="mt-0.5 text-caption text-text-muted">
            {itemCount === 0 ? 'No items yet' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="shrink-0 text-danger hover:text-danger">
            Clear
          </Button>
        )}
      </div>

      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-styled">
        {items.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center px-8 text-center text-text-muted">
            <p className="text-body-medium text-text-primary">Cart is empty</p>
            <p className="mt-1 max-w-xs text-caption text-text-muted">
              Search or scan a product to start this sale.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {items.map((item) => (
              <li key={item.productId} className="group px-5 py-3.5 hover:bg-surface-raised/50">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-medium text-text-primary">{item.name}</p>
                    <p className="mt-0.5 truncate font-mono text-caption text-text-muted">
                      {item.sku} · {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <p className="shrink-0 text-body-medium tabular-nums text-text-primary">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 transition-fast hover:bg-danger-muted hover:text-danger group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2.5">
                  <QuantityInput item={item} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle px-5 py-3.5">
          <span className="text-caption text-text-muted">{itemCount} units</span>
          <span className="shrink-0 text-subheading tabular-nums text-text-primary">{formatCurrency(subtotal)}</span>
        </div>
      )}
    </section>
  )
}
