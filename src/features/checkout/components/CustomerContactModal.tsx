import { useEffect, useState } from 'react'
import { Button, Input, Modal } from '../../../components/ui'
import {
  checkoutContactDefaults,
  checkoutContactSchema,
  type CheckoutContactFormData,
} from '../schemas/checkoutSchema'

interface Props {
  open: boolean
  loading?: boolean
  onSkip: () => void
  onConfirm: (contact: CheckoutContactFormData) => void
  onClose: () => void
}

export default function CustomerContactModal({ open, loading, onSkip, onConfirm, onClose }: Props) {
  const [values, setValues] = useState<CheckoutContactFormData>({ ...checkoutContactDefaults })
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutContactFormData, string>>>({})

  useEffect(() => {
    if (open) {
      setValues({ ...checkoutContactDefaults })
      setErrors({})
    }
  }, [open])

  const setField = <K extends keyof CheckoutContactFormData>(key: K, value: CheckoutContactFormData[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-enable digital invoice when email is filled in
      // WhatsApp channel temporarily disabled — restore `|| key === 'whatsapp'` when re-enabling
      if (key === 'email') {
        const email = String(value)
        if (email.trim()) {
          next.sendDigitalReceipt = true
        }
      }
      return next
    })
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleConfirm = () => {
    const result = checkoutContactSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CheckoutContactFormData, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CheckoutContactFormData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    onConfirm(result.data)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (loading) return
        onClose()
      }}
      title="Customer details"
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button loading={loading} onClick={handleConfirm}>
            Complete Sale
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-caption text-text-muted">
          Optional — skip for walk-ins.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            placeholder="Jane Doe"
            value={values.name ?? ''}
            error={errors.name}
            onChange={(e) => setField('name', e.target.value)}
            disabled={loading}
            autoFocus
          />

          <Input
            label="Mobile"
            placeholder="+1 555 0100"
            value={values.phone ?? ''}
            error={errors.phone}
            onChange={(e) => setField('phone', e.target.value)}
            disabled={loading}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="jane@example.com"
          value={values.email ?? ''}
          error={errors.email}
          onChange={(e) => setField('email', e.target.value)}
          disabled={loading}
        />

        <label className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border-subtle accent-[var(--color-accent)]"
            checked={values.sendDigitalReceipt}
            onChange={(e) => setField('sendDigitalReceipt', e.target.checked)}
            disabled={loading}
          />
          <span className="text-body text-text-primary">Send digital invoice by email</span>
        </label>
      </div>
    </Modal>
  )
}
