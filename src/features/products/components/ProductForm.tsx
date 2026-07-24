import { useRef, useCallback } from 'react'
import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { productSchema, productDefaults, type ProductFormData } from '../schemas/productSchema'
import { useCategoryDropdown } from '../../categories/hooks/useCategories'
import { useSuppliers } from '../hooks/useProducts'
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner'

interface Props {
  initialValues?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => void | Promise<void>
  id?: string
  /** Prefer focusing barcode field for scan-to-add workflows */
  focusBarcode?: boolean
}

export default function ProductForm({ initialValues, onSubmit, id = 'product-form', focusBarcode }: Props) {
  const { data: categories = [] } = useCategoryDropdown()
  const { data: suppliers = [] } = useSuppliers()
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    schema: productSchema,
    initialValues: { ...productDefaults, ...initialValues },
    onSubmit,
  })

  const nameField = form.getFieldProps('name')
  const skuField = form.getFieldProps('sku')
  const barcodeField = form.getFieldProps('barcode')
  const priceField = form.getFieldProps('price', 'number')
  const costField = form.getFieldProps('cost', 'number')
  const stockField = form.getFieldProps('stock', 'number')
  const minStockField = form.getFieldProps('minStock', 'number')
  const categoryField = form.getFieldProps('categoryId')
  const supplierField = form.getFieldProps('supplierId')

  const onScan = useCallback((code: string) => {
    form.setValue('barcode', code)
    // If SKU empty, seed from barcode for convenience
    if (!String(form.values.sku || '').trim()) {
      form.setValue('sku', code)
    }
    barcodeInputRef.current?.focus()
  }, [form])

  useBarcodeScanner({
    enabled: true,
    minLength: 4,
    onScan,
  })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-5">
      <div className="space-y-4">
        <p className="text-caption-medium text-text-muted uppercase tracking-wider">Basic Information</p>
        <Input
          label="Product Name"
          placeholder="e.g. Coca-Cola 330ml"
          value={nameField.value}
          error={nameField.error}
          onChange={nameField.onChange}
          onBlur={nameField.onBlur}
          autoFocus={!focusBarcode}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="SKU"
            placeholder="e.g. BEV-001"
            value={skuField.value}
            error={skuField.error}
            onChange={skuField.onChange}
            onBlur={skuField.onBlur}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-barcode" className="text-caption-medium text-text-secondary">
              Barcode
            </label>
            <input
              ref={barcodeInputRef}
              id="product-barcode"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              placeholder="Scan or type barcode"
              value={String(barcodeField.value ?? '')}
              onChange={(e) => form.setValue('barcode', e.currentTarget.value)}
              onBlur={barcodeField.onBlur}
              autoFocus={focusBarcode}
              className="h-9 w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            {barcodeField.error && (
              <p className="text-caption text-danger">{barcodeField.error}</p>
            )}
            <p className="text-caption text-text-muted">
              Scan with a USB barcode scanner — it fills this field automatically
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-caption-medium text-text-muted uppercase tracking-wider">Pricing</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Selling Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={priceField.value || ''}
            error={priceField.error}
            onChange={priceField.onChange}
            onBlur={priceField.onBlur}
          />
          <Input
            label="Cost Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={costField.value || ''}
            error={costField.error}
            onChange={costField.onChange}
            onBlur={costField.onBlur}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-caption-medium text-text-muted uppercase tracking-wider">Inventory</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Opening Stock"
            type="number"
            min="0"
            placeholder="0"
            value={stockField.value || ''}
            error={stockField.error}
            onChange={stockField.onChange}
            onBlur={stockField.onBlur}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            min="0"
            placeholder="5"
            value={minStockField.value || ''}
            error={minStockField.error}
            onChange={minStockField.onChange}
            onBlur={minStockField.onBlur}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-caption-medium text-text-muted uppercase tracking-wider">Classification</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoryId" className="text-caption-medium text-text-secondary">Category</label>
            <select
              id="categoryId"
              value={categoryField.value as string}
              onChange={categoryField.onChange}
              onBlur={categoryField.onBlur}
              className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body text-text-primary transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="supplierId" className="text-caption-medium text-text-secondary">Supplier</label>
            <select
              id="supplierId"
              value={supplierField.value as string}
              onChange={supplierField.onChange}
              onBlur={supplierField.onBlur}
              className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body text-text-primary transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            >
              <option value="">No Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </form>
  )
}

export { type ProductFormData }
