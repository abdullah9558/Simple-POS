import { Input } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { categorySchema, categoryDefaults, type CategoryFormData } from '../schemas/categorySchema'

interface Props {
  initialValues?: Partial<CategoryFormData>
  onSubmit: (data: CategoryFormData) => void | Promise<void>
  id?: string
}

export default function CategoryForm({ initialValues, onSubmit, id = 'category-form' }: Props) {
  const form = useForm({
    schema: categorySchema,
    initialValues: { ...categoryDefaults, ...initialValues },
    onSubmit,
  })

  const nameField = form.getFieldProps('name')
  const descField = form.getFieldProps('description')

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <Input
        label="Category Name"
        placeholder="e.g. Beverages"
        value={nameField.value}
        error={nameField.error}
        onChange={nameField.onChange}
        onBlur={nameField.onBlur}
        autoFocus
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cat-description" className="text-caption-medium text-text-secondary">
          Description
        </label>
        <textarea
          id="cat-description"
          placeholder="Optional description for this category"
          value={descField.value}
          onChange={(e) => form.setValue('description', e.target.value)}
          onBlur={descField.onBlur}
          rows={3}
          className={`rounded-md border bg-surface-raised px-3 py-2 text-body text-text-primary placeholder:text-text-muted transition-default transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none ${
            descField.error ? 'border-danger' : 'border-border-subtle'
          }`}
        />
        {descField.error && <p className="text-caption text-danger">{descField.error}</p>}
      </div>
    </form>
  )
}
