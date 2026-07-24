import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { stockAdjustmentSchema, stockAdjustmentDefaults, type StockAdjustmentFormData } from '../schemas/inventorySchema'
import type { Product } from '../../products/api/productApi'

interface Props {
  product?: Product | null
  products: Product[]
  onSubmit: (data: StockAdjustmentFormData) => void | Promise<void>
  id?: string
}

export default function StockAdjustmentForm({ product, products, onSubmit, id = 'stock-adjust-form' }: Props) {
  const form = useForm({
    schema: stockAdjustmentSchema,
    initialValues: {
      ...stockAdjustmentDefaults,
      productId: product?.id ?? '',
    },
    onSubmit,
  })

  const productField = form.getFieldProps('productId')
  const typeField = form.getFieldProps('type')
  const qtyField = form.getFieldProps('quantity')
  const reasonField = form.getFieldProps('reason')

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="adj-product" className="text-caption-medium text-text-secondary">Product</label>
        <select
          id="adj-product"
          value={productField.value}
          onChange={(e) => form.setValue('productId', e.target.value)}
          disabled={!!product}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-60"
        >
          <option value="">Select product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.stock} in stock</option>
          ))}
        </select>
        {productField.error && <p className="text-caption text-danger">{productField.error}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="adj-type" className="text-caption-medium text-text-secondary">Type</label>
        <select
          id="adj-type"
          value={typeField.value}
          onChange={(e) => form.setValue('type', e.target.value as StockAdjustmentFormData['type'])}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="RETURN">Return</option>
        </select>
      </div>

      <Input
        label="Quantity"
        type="number"
        min={1}
        value={qtyField.value}
        error={qtyField.error}
        onChange={(e) => form.setValue('quantity', Number(e.target.value))}
        onBlur={qtyField.onBlur}
      />

      <Input
        label="Reason"
        placeholder="Optional reason for adjustment"
        value={reasonField.value}
        error={reasonField.error}
        onChange={reasonField.onChange}
        onBlur={reasonField.onBlur}
      />
    </form>
  )
}
