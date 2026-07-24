import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { authSettingsSchema, type AuthSettingsFormData } from '../schemas/settingsSchema'

interface Props {
  initialValues: AuthSettingsFormData
  onSubmit: (data: AuthSettingsFormData) => void | Promise<void>
  id?: string
}

export default function AuthSettingsForm({ initialValues, onSubmit, id = 'auth-form' }: Props) {
  const form = useForm({ schema: authSettingsSchema, initialValues, onSubmit })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-6">
      <div className="rounded-lg border border-border-subtle bg-surface-inset p-4 space-y-2">
        <h4 className="text-body-medium text-text-primary">Authentication Foundation</h4>
        <p className="text-caption text-text-muted">
          Passwords are hashed with scrypt before storage. Session management and login UI can be built on these settings.
        </p>
        <ul className="text-caption text-text-muted list-disc pl-4 space-y-1">
          <li>Secure password hashing (scrypt + salt)</li>
          <li>Role-based permissions (Admin, Manager, Cashier)</li>
          <li>Configurable session timeout</li>
          <li>Minimum password length enforcement</li>
        </ul>
      </div>

      <Input
        label="Session Timeout (minutes)"
        type="number"
        min={5}
        max={1440}
        {...form.getFieldProps('authSessionTimeout', 'number')}
      />

      <Input
        label="Minimum Password Length"
        type="number"
        min={6}
        max={32}
        {...form.getFieldProps('authMinPasswordLength', 'number')}
      />
    </form>
  )
}
