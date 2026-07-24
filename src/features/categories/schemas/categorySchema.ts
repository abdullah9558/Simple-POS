import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(60, 'Name must be 60 characters or less'),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .optional()
    .or(z.literal('')),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const categoryDefaults: CategoryFormData = {
  name: '',
  description: '',
}
