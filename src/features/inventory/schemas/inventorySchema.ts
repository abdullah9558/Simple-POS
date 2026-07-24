import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  company: z.string().max(100).optional().or(z.literal('')),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

export const supplierDefaults: SupplierFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  company: '',
}

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().max(200).optional().or(z.literal('')),
})

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>

export const stockAdjustmentDefaults: StockAdjustmentFormData = {
  productId: '',
  type: 'ADJUSTMENT',
  quantity: 1,
  reason: '',
}

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  cost: z.number().min(0),
})

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  note: z.string().max(500).optional().or(z.literal('')),
  items: z.array(purchaseOrderItemSchema).min(1, 'Add at least one item'),
})

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

export const purchaseOrderDefaults: PurchaseOrderFormData = {
  supplierId: '',
  note: '',
  items: [{ productId: '', quantity: 1, cost: 0 }],
}
