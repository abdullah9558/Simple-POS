import { useState, useCallback, useEffect } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import { useReceiveStock } from '../hooks/useInventory'
import type { PurchaseOrder } from '../api/inventoryApi'

interface Props {
  open: boolean
  order: PurchaseOrder | null
  onClose: () => void
}

export default function ReceiveStockDialog({ open, order, onClose }: Props) {
  const receiveStock = useReceiveStock()
  const { toast } = useToast()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!open || !order) return
    const initial: Record<string, number> = {}
    for (const item of order.items) {
      initial[item.id] = item.quantity - item.receivedQty
    }
    setQuantities(initial)
  }, [open, order])

  const pendingItems = order?.items.filter((i) => i.receivedQty < i.quantity) ?? []

  const handleConfirm = useCallback(async () => {
    if (!order) return
    const pending = order.items.filter((i) => i.receivedQty < i.quantity)
    const items = pending
      .filter((i) => (quantities[i.id] ?? 0) > 0)
      .map((i) => ({ itemId: i.id, quantity: quantities[i.id] }))

    if (items.length === 0) {
      toast('Enter quantity to receive', 'error')
      return
    }

    try {
      await receiveStock.mutateAsync({ orderId: order.id, items })
      toast(`Stock received for ${order.orderNo}`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Receive failed', 'error')
    }
  }, [order, quantities, receiveStock, toast, onClose])

  if (!order) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Receive Stock — ${order.orderNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} loading={receiveStock.isPending}>Receive Stock</Button>
        </>
      }
    >
      <div className="space-y-3">
        {pendingItems.length === 0 ? (
          <p className="text-body text-text-muted">All items have been received.</p>
        ) : (
          pendingItems.map((item) => {
            const remaining = item.quantity - item.receivedQty
            return (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
                <div>
                  <p className="text-body-medium text-text-primary">{item.productName}</p>
                  <p className="text-caption text-text-muted">{item.sku} — {remaining} remaining of {item.quantity}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={remaining}
                  value={quantities[item.id] ?? remaining}
                  onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                  className="h-9 w-20 rounded-md border border-border-subtle bg-surface px-2 text-body text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
