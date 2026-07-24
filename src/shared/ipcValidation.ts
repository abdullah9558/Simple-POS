import { z, type ZodType } from 'zod'

export class IpcValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IpcValidationError'
  }
}

export function parseIpcArg<T>(schema: ZodType<T>, value: unknown, label = 'argument'): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join('.') || label}: ${i.message}`).join('; ')
    throw new IpcValidationError(detail || `Invalid ${label}`)
  }
  return result.data
}

export const idSchema = z.string().min(1, 'id is required')

export const optionalFiltersSchema = z.record(z.string(), z.unknown()).optional()
