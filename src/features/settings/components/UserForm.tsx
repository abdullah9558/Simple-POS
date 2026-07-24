import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { userSchema, type UserFormData } from '../schemas/settingsSchema'

interface Props {
  initialValues?: Partial<UserFormData>
  isEdit?: boolean
  onSubmit: (data: UserFormData) => void | Promise<void>
  id?: string
}

export default function UserForm({ initialValues, isEdit, onSubmit, id = 'user-form' }: Props) {
  const form = useForm({
    schema: userSchema,
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'CASHIER' as const,
      isActive: true,
      ...initialValues,
    },
    onSubmit,
  })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <Input label="Name" placeholder="Full name" {...form.getFieldProps('name')} autoFocus />
      <Input label="Email" type="email" placeholder="user@example.com" {...form.getFieldProps('email')} />
      <Input
        label={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
        type="password"
        placeholder="••••••••"
        {...form.getFieldProps('password')}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="user-role" className="text-caption-medium text-text-secondary">Role</label>
        <select
          id="user-role"
          value={form.values.role}
          onChange={(e) => form.setValue('role', e.target.value as UserFormData['role'])}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Administrator</option>
          <option value="MANAGER">Manager</option>
          <option value="CASHIER">Cashier</option>
        </select>
      </div>
      {isEdit && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="user-active"
            checked={form.values.isActive ?? true}
            onChange={(e) => form.setValue('isActive', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <label htmlFor="user-active" className="text-body text-text-secondary">Active account</label>
        </div>
      )}
    </form>
  )
}
