import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  creditBalance: z.number().min(0, 'Cannot be negative').default(0),
  outstandingBalance: z.number().min(0, 'Cannot be negative').default(0),
})

export type CustomerFormData = z.infer<typeof customerSchema>

export const customerDefaults: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  creditBalance: 0,
  outstandingBalance: 0,
}
