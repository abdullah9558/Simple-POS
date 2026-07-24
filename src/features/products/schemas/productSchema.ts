import { z } from 'zod'

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(120, 'Name must be 120 characters or less'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(30, 'SKU must be 30 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'SKU can only contain letters, numbers, and hyphens'),
  barcode: z
    .string()
    .max(30, 'Barcode must be 30 characters or less')
    .regex(/^[0-9]*$/, 'Barcode can only contain digits')
    .optional()
    .or(z.literal('')),
  price: z
    .number({ message: 'Price is required' })
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price is too high'),
  cost: z
    .number({ message: 'Cost is required' })
    .min(0, 'Cost cannot be negative')
    .max(999999.99, 'Cost is too high'),
  stock: z
    .number({ message: 'Stock is required' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  minStock: z
    .number({ message: 'Min stock is required' })
    .int('Min stock must be a whole number')
    .min(0, 'Min stock cannot be negative'),
  categoryId: z.string().optional().or(z.literal('')),
  supplierId: z.string().optional().or(z.literal('')),
})

export type ProductFormData = z.infer<typeof productSchema>

export const productDefaults: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 5,
  categoryId: '',
  supplierId: '',
}
