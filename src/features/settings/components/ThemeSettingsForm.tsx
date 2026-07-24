import { useForm } from '../../../hooks/useForm'
import { themeSchema, THEMES, type ThemeFormData } from '../schemas/settingsSchema'

interface Props {
  initialValues: ThemeFormData
  onSubmit: (data: ThemeFormData) => void | Promise<void>
  id?: string
}

export default function ThemeSettingsForm({ initialValues, onSubmit, id = 'theme-form' }: Props) {
  const form = useForm({ schema: themeSchema, initialValues, onSubmit })

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <p className="text-caption text-text-muted">Choose the appearance for the application</p>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => form.setValue('theme', t.value)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-fast ${
              form.values.theme === t.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-subtle text-text-muted hover:border-border-default'
            }`}
          >
            <div className={`h-10 w-16 rounded-md border ${
              t.value === 'dark' ? 'bg-gray-900 border-gray-700' :
              t.value === 'light' ? 'bg-white border-gray-200' :
              'bg-gradient-to-r from-gray-900 to-white border-gray-400'
            }`} />
            <span className="text-caption-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </form>
  )
}
