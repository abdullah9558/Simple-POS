import { z } from 'zod'

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export const checkoutContactSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
  email: z.union([
    z.literal(''),
    z.string().email('Enter a valid email address'),
  ]).optional(),
  sendDigitalReceipt: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // WhatsApp receipt temporarily disabled — email only for digital invoice
  if (data.sendDigitalReceipt && !data.email?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Provide an email address for a digital receipt',
      path: ['email'],
    })
  }
  // if (data.sendDigitalReceipt && !data.email?.trim() && !data.whatsapp?.trim()) {
  //   ctx.addIssue({
  //     code: 'custom',
  //     message: 'Provide a WhatsApp number or email for a digital receipt',
  //     path: ['whatsapp'],
  //   })
  // }
})

export type CheckoutContactFormData = z.infer<typeof checkoutContactSchema>

export const checkoutContactDefaults: CheckoutContactFormData = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  sendDigitalReceipt: false,
}

export const completeSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Cart must have at least one item'),
  method: z.enum(['CASH', 'CARD', 'MOBILE']),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(1).default(0),
  amountReceived: z.number().min(0).default(0),
  note: z.string().max(500).optional().or(z.literal('')),
  customerId: z.string().optional().or(z.literal('')),
  contact: checkoutContactSchema.optional(),
})

export type CompleteSaleInput = z.infer<typeof completeSaleSchema>
