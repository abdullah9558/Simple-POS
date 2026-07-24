import { useState, useCallback, type ChangeEvent } from 'react'
import type { z, ZodObject, ZodRawShape } from 'zod'

export interface UseFormOptions<T extends ZodRawShape> {
  schema: ZodObject<T>
  initialValues: z.infer<ZodObject<T>>
  onSubmit: (data: z.infer<ZodObject<T>>) => void | Promise<void>
}

export interface FieldProps {
  value: string | number
  error?: string
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onBlur: () => void
}

export function useForm<T extends ZodRawShape>({ schema, initialValues, onSubmit }: UseFormOptions<T>) {
  type FormData = z.infer<ZodObject<T>>

  const [values, setValues] = useState<FormData>({ ...initialValues })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)

  const validateField = useCallback(
    (name: keyof FormData, value: unknown) => {
      const fieldSchema = schema.shape[name as string]
      if (!fieldSchema) return undefined
      const result = (fieldSchema as z.ZodType).safeParse(value)
      return result.success ? undefined : result.error.issues[0]?.message
    },
    [schema],
  )

  const setValue = useCallback(
    (name: keyof FormData, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }))
      if (touched[name]) {
        const err = validateField(name, value)
        setErrors((prev) => {
          const next = { ...prev }
          if (err) next[name] = err
          else delete next[name]
          return next
        })
      }
    },
    [touched, validateField],
  )

  const setFieldTouched = useCallback(
    (name: keyof FormData) => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      const err = validateField(name, values[name])
      setErrors((prev) => {
        const next = { ...prev }
        if (err) next[name] = err
        else delete next[name]
        return next
      })
    },
    [validateField, values],
  )

  const getFieldProps = useCallback(
    (name: keyof FormData, type: 'text' | 'number' = 'text'): FieldProps => ({
      value: values[name] as string | number,
      error: touched[name] ? errors[name] : undefined,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const raw = e.target.value
        const parsed = type === 'number' ? (raw === '' ? 0 : Number(raw)) : raw
        setValue(name, parsed)
      },
      onBlur: () => setFieldTouched(name),
    }),
    [values, errors, touched, setValue, setFieldTouched],
  )

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      const allTouched = Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof FormData, boolean>,
      )
      setTouched(allTouched)

      const result = schema.safeParse(values)
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {}
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof FormData
          if (!fieldErrors[key]) fieldErrors[key] = issue.message
        }
        setErrors(fieldErrors)
        return
      }

      setSubmitting(true)
      try {
        await onSubmit(result.data)
      } finally {
        setSubmitting(false)
      }
    },
    [schema, values, initialValues, onSubmit],
  )

  const reset = useCallback(
    (next?: Partial<FormData>) => {
      setValues({ ...initialValues, ...next })
      setErrors({})
      setTouched({})
    },
    [initialValues],
  )

  const isValid = schema.safeParse(values).success

  return { values, errors, touched, submitting, isValid, setValue, getFieldProps, handleSubmit, reset }
}
