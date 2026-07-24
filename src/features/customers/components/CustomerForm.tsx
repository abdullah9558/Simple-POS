import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { customerSchema, customerDefaults, type CustomerFormData } from '../schemas/customerSchema'

interface Props {
  initialValues?: Partial<CustomerFormData>
  onSubmit: (data: CustomerFormData) => void | Promise<void>
  id?: string
}

export default function CustomerForm({ initialValues, onSubmit, id = 'customer-form' }: Props) {
  const form = useForm({
    schema: customerSchema,
    initialValues: { ...customerDefaults, ...initialValues },
    onSubmit,
  })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <Input label="Name" placeholder="Customer name" {...form.getFieldProps('name')} autoFocus />
      <Input label="Email" type="email" placeholder="email@example.com" {...form.getFieldProps('email')} />
      <Input label="Phone" placeholder="+1 555-0100" {...form.getFieldProps('phone')} />
      <Input label="WhatsApp" placeholder="+1 555-0100" {...form.getFieldProps('whatsapp')} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cust-address" className="text-caption-medium text-text-secondary">Address</label>
        <textarea
          id="cust-address"
          placeholder="Full address"
          value={form.getFieldProps('address').value as string}
          onChange={(e) => form.setValue('address', e.target.value)}
          onBlur={form.getFieldProps('address').onBlur}
          rows={2}
          className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Credit Balance" type="number" min={0} step={0.01} {...form.getFieldProps('creditBalance', 'number')} />
        <Input label="Outstanding Balance" type="number" min={0} step={0.01} {...form.getFieldProps('outstandingBalance', 'number')} />
      </div>
    </form>
  )
}
