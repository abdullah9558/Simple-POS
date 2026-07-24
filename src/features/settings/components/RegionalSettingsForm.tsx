import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { regionalSchema, CURRENCIES, type RegionalFormData } from '../schemas/settingsSchema'

interface Props {
  initialValues: RegionalFormData
  onSubmit: (data: RegionalFormData) => void | Promise<void>
  id?: string
}

export default function RegionalSettingsForm({ initialValues, onSubmit, id = 'regional-form' }: Props) {
  const form = useForm({ schema: regionalSchema, initialValues, onSubmit })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currency" className="text-caption-medium text-text-secondary">Currency</label>
        <select
          id="currency"
          value={form.values.currency}
          onChange={(e) => form.setValue('currency', e.target.value as RegionalFormData['currency'])}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="tax-enabled"
          checked={form.values.taxEnabled}
          onChange={(e) => form.setValue('taxEnabled', e.target.checked)}
          className="h-4 w-4 rounded border-border-subtle accent-accent"
        />
        <label htmlFor="tax-enabled" className="text-body text-text-secondary">Enable tax on sales</label>
      </div>

      <Input
        label="Tax Rate (%)"
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={Math.round((form.values.taxRate as number) * 10000) / 100}
        onChange={(e) => form.setValue('taxRate', Number(e.target.value) / 100)}
      />

      <Input
        label="Low Stock Threshold"
        type="number"
        min={1}
        {...form.getFieldProps('lowStockThreshold', 'number')}
      />
    </form>
  )
}
