import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { purchaseOrderSchema, purchaseOrderDefaults, type PurchaseOrderFormData } from '../schemas/inventorySchema'
import { useActiveProducts, useSuppliers, useCreatePurchaseOrder } from '../hooks/useInventory'

interface Props {
  open: boolean
  onClose: () => void
}

const FORM_ID = 'create-po-form'

function PurchaseOrderForm({ onSubmit, id }: { onSubmit: (data: PurchaseOrderFormData) => void; id: string }) {
  const { data: suppliers = [] } = useSuppliers({ status: 'active' })
  const { data: products = [] } = useActiveProducts()
  const form = useForm({
    schema: purchaseOrderSchema,
    initialValues: purchaseOrderDefaults,
    onSubmit,
  })

  const items = form.values.items

  const addItem = () => {
    form.setValue('items', [...items, { productId: '', quantity: 1, cost: 0 }])
  }

  const removeItem = (idx: number) => {
    if (items.length <= 1) return
    form.setValue('items', items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof typeof items[0], value: string | number) => {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: value }
    if (field === 'productId') {
      const product = products.find((p) => p.id === value)
      if (product) next[idx].cost = product.cost
    }
    form.setValue('items', next)
  }

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-caption-medium text-text-secondary">Supplier</label>
        <select
          value={form.values.supplierId}
          onChange={(e) => form.setValue('supplierId', e.target.value)}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="">Select supplier...</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-caption-medium text-text-secondary">Items</span>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>+ Add Item</Button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-end gap-2 rounded-lg border border-border-subtle p-3">
            <div className="flex-1">
              <label className="text-overline text-text-muted">Product</label>
              <select
                value={item.productId}
                onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                className="mt-1 h-8 w-full rounded border border-border-subtle bg-surface px-2 text-caption focus:outline-none focus:ring-1 focus:ring-accent/50"
              >
                <option value="">Select...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="w-20">
              <label className="text-overline text-text-muted">Qty</label>
              <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                className="mt-1 h-8 w-full rounded border border-border-subtle bg-surface px-2 text-caption text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>
            <div className="w-24">
              <label className="text-overline text-text-muted">Cost</label>
              <input type="number" min={0} step={0.01} value={item.cost} onChange={(e) => updateItem(idx, 'cost', Number(e.target.value))}
                className="mt-1 h-8 w-full rounded border border-border-subtle bg-surface px-2 text-caption text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="text-danger">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-caption-medium text-text-secondary">Note</label>
        <textarea
          value={form.values.note ?? ''}
          onChange={(e) => form.setValue('note', e.target.value)}
          rows={2}
          placeholder="Optional note..."
          className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
        />
      </div>
    </form>
  )
}

export default function CreatePurchaseOrderDialog({ open, onClose }: Props) {
  const createPO = useCreatePurchaseOrder()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: PurchaseOrderFormData) => {
    try {
      const order = await createPO.mutateAsync(data)
      toast(`Purchase order ${order.orderNo} created`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create order', 'error')
    }
  }, [createPO, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Create Purchase Order" size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={createPO.isPending}>Create Order</Button>
      </>
    }>
      <PurchaseOrderForm id={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  )
}
