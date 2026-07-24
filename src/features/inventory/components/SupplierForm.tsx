import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { supplierSchema, supplierDefaults, type SupplierFormData } from '../schemas/inventorySchema'

interface Props {
  initialValues?: Partial<SupplierFormData>
  onSubmit: (data: SupplierFormData) => void | Promise<void>
  id?: string
}

export default function SupplierForm({ initialValues, onSubmit, id = 'supplier-form' }: Props) {
  const form = useForm({
    schema: supplierSchema,
    initialValues: { ...supplierDefaults, ...initialValues },
    onSubmit,
  })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <Input label="Name" placeholder="Supplier name" {...form.getFieldProps('name')} autoFocus />
      <Input label="Company" placeholder="Company name" {...form.getFieldProps('company')} />
      <Input label="Email" type="email" placeholder="email@example.com" {...form.getFieldProps('email')} />
      <Input label="Phone" placeholder="+1 555-0100" {...form.getFieldProps('phone')} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sup-address" className="text-caption-medium text-text-secondary">Address</label>
        <textarea
          id="sup-address"
          placeholder="Full address"
          value={form.getFieldProps('address').value}
          onChange={(e) => form.setValue('address', e.target.value)}
          onBlur={form.getFieldProps('address').onBlur}
          rows={2}
          className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
        />
      </div>
    </form>
  )
}
