import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { storeInfoSchema, type StoreInfoFormData } from '../schemas/settingsSchema'

interface Props {
  initialValues: StoreInfoFormData
  onSubmit: (data: StoreInfoFormData) => void | Promise<void>
  id?: string
}

export default function StoreInfoForm({ initialValues, onSubmit, id = 'store-info-form' }: Props) {
  const form = useForm({
    schema: storeInfoSchema,
    initialValues,
    onSubmit,
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500_000) return
    const reader = new FileReader()
    reader.onload = () => form.setValue('storeLogo', reader.result as string)
    reader.readAsDataURL(file)
  }

  const logo = form.values.storeLogo as string

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <div className="flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-surface-inset">
          {logo ? (
            <img src={logo} alt="Store logo" className="h-full w-full object-contain" />
          ) : (
            <svg className="h-8 w-8 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-caption-medium text-text-secondary">Store Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoChange}
            className="block w-full text-caption text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-caption-medium file:text-white" />
          {logo && (
            <button type="button" onClick={() => form.setValue('storeLogo', '')} className="text-caption text-danger hover:underline">
              Remove logo
            </button>
          )}
        </div>
      </div>

      <Input label="Store Name" placeholder="My Store" {...form.getFieldProps('storeName')} />
      <Input label="Phone" placeholder="+1 555-0100" {...form.getFieldProps('storePhone')} />
      <Input label="Email" type="email" placeholder="store@example.com" {...form.getFieldProps('storeEmail')} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="store-address" className="text-caption-medium text-text-secondary">Address</label>
        <textarea
          id="store-address"
          value={form.getFieldProps('storeAddress').value as string}
          onChange={(e) => form.setValue('storeAddress', e.target.value)}
          onBlur={form.getFieldProps('storeAddress').onBlur}
          rows={2}
          placeholder="Store address"
          className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
        />
      </div>
    </form>
  )
}
