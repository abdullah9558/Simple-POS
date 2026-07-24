import { z } from 'zod'

export const receiptItemSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(64),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

export const receiptDataSchema = z.object({
  invoiceNo: z.string().min(1).max(64),
  createdAt: z.string().min(1),
  method: z.string().min(1).max(32),
  items: z.array(receiptItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1),
  total: z.number().nonnegative(),
  amountReceived: z.number().nonnegative(),
  change: z.number().nonnegative(),
  note: z.string().max(500).optional(),
  paperWidth: z.enum(['58', '80']),
  store: z.object({
    name: z.string().max(100),
    address: z.string().max(200),
    phone: z.string().max(40),
    email: z.string().max(120),
    logo: z.string().max(2_000_000).default(''),
    footer: z.string().max(500),
    currency: z.string().min(1).max(8),
  }),
})

export const checkoutContactIpcSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  sendDigitalReceipt: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.sendDigitalReceipt && !data.email?.trim() && !data.whatsapp?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Provide a WhatsApp number or email to send a digital receipt',
      path: ['email'],
    })
  }
})

export const createSaleIpcSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
  method: z.enum(['CASH', 'CARD', 'MOBILE']).optional(),
  discount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  note: z.string().max(500).optional(),
  customerId: z.string().optional(),
  userId: z.string().optional(),
  contact: checkoutContactIpcSchema.optional(),
})

export const productFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(),
}).optional()

export const createProductIpcSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(64),
  barcode: z.string().max(64).optional(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
})

export const updateProductIpcSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().min(1).max(64).optional(),
  barcode: z.string().max(64).nullable().optional(),
  price: z.number().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const createUserIpcSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'CASHIER']),
})

export const updateUserIpcSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'CASHIER']).optional(),
  isActive: z.boolean().optional(),
})
