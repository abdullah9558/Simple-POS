import { z } from 'zod'

export const storeInfoSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeAddress: z.string().max(200).optional().or(z.literal('')),
  storePhone: z.string().max(20).optional().or(z.literal('')),
  storeEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  storeLogo: z.string().optional().or(z.literal('')),
})

export const receiptSchema = z.object({
  receiptFooter: z.string().max(500).optional().or(z.literal('')),
  receiptPaperWidth: z.enum(['58', '80']),
  receiptAutoPrint: z.boolean(),
  receiptPrinterName: z.string().max(200).optional().or(z.literal('')),
  receiptPrintMode: z.enum(['html', 'escpos']),
})

export const regionalSchema = z.object({
  currency: z.enum(['USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR']),
  taxRate: z.number().min(0).max(1),
  taxEnabled: z.boolean(),
  lowStockThreshold: z.number().int().min(1).max(1000),
})

export const themeSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
})

export const authSettingsSchema = z.object({
  authSessionTimeout: z.number().int().min(5).max(1440),
  authMinPasswordLength: z.number().int().min(6).max(32),
})

export const communicationSchema = z.object({
  smtpHost: z.string().max(200).optional().or(z.literal('')),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecure: z.boolean(),
  smtpUser: z.string().max(200).optional().or(z.literal('')),
  smtpPassword: z.string().max(500).optional().or(z.literal('')),
  smtpFrom: z.union([z.literal(''), z.string().email('Enter a valid From email')]).optional(),
  greenApiIdInstance: z.string().max(50).optional().or(z.literal('')),
  greenApiTokenInstance: z.string().max(200).optional().or(z.literal('')),
  greenApiUrl: z.string().max(200).optional().or(z.literal('')),
  greenApiMediaUrl: z.string().max(200).optional().or(z.literal('')),
})

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().optional().or(z.literal('')),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'CASHIER']),
  isActive: z.boolean().optional(),
})

export type UserFormData = z.infer<typeof userSchema>
export type StoreInfoFormData = z.infer<typeof storeInfoSchema>
export type ReceiptFormData = z.infer<typeof receiptSchema>
export type RegionalFormData = z.infer<typeof regionalSchema>
export type ThemeFormData = z.infer<typeof themeSchema>
export type AuthSettingsFormData = z.infer<typeof authSettingsSchema>
export type CommunicationFormData = z.infer<typeof communicationSchema>

export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'PKR', label: 'PKR — Pakistani Rupee' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
] as const

export const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const
