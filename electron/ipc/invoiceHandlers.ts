import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { InvoicePdfService } from '../../src/services/InvoicePdfService.ts'
import { InvoiceDeliveryService } from '../../src/services/InvoiceDeliveryService.ts'
import { createEmailService } from '../../src/services/EmailService.ts'
import { createWhatsAppService, buildWhatsAppThankYouMessage } from '../../src/services/WhatsAppService.ts'
import { SettingsService } from '../../src/services/SettingsService.ts'
import { isSmtpConfigured, isGreenApiConfigured } from '../../src/shared/settings.ts'
import { parseIpcArg } from '../../src/shared/ipcValidation.ts'
import type { InvoiceData } from '../../src/shared/invoice.ts'

const invoiceDataSchema: z.ZodType<InvoiceData> = z.object({
  invoiceNo: z.string().min(1),
  createdAt: z.string().min(1),
  method: z.string().min(1),
  cashierName: z.string().min(1),
  customerName: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    sku: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
    total: z.number().nonnegative(),
  })).min(1),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1),
  total: z.number().nonnegative(),
  note: z.string().optional(),
  store: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    footer: z.string(),
    currency: z.string().min(1),
  }),
  thankYouMessage: z.string(),
})

const deliverSchema = z.object({
  invoice: invoiceDataSchema,
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
})

const testEmailSchema = z.object({
  to: z.string().email(),
})

const testWhatsAppSchema = z.object({
  to: z.string().min(5).max(30),
})

function sampleInvoice(settings: {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  receiptFooter: string
  currency: string
}): InvoiceData {
  return {
    invoiceNo: 'TEST-INV',
    createdAt: new Date().toISOString(),
    method: 'CASH',
    cashierName: 'Test',
    customerName: 'Test Customer',
    items: [{ name: 'Test Item', sku: 'TEST', quantity: 1, price: 1, total: 1 }],
    subtotal: 1,
    discount: 0,
    tax: 0,
    taxRate: 0,
    total: 1,
    store: {
      name: settings.storeName || 'Store',
      address: settings.storeAddress || '',
      phone: settings.storePhone || '',
      email: settings.storeEmail || '',
      footer: settings.receiptFooter || '',
      currency: settings.currency || 'USD',
    },
    thankYouMessage: 'This is a test invoice from POS System.',
  }
}

export function registerInvoiceHandlers() {
  const pdfService = new InvoicePdfService()
  const deliveryService = new InvoiceDeliveryService()
  const settingsService = new SettingsService()

  ipcMain.handle(IPC.INVOICE_GENERATE_PDF, (_e, payload) => {
    const invoice = parseIpcArg(invoiceDataSchema, payload, 'invoice')
    const pdf = pdfService.generate(invoice)
    return {
      filename: pdf.filename,
      mimeType: pdf.mimeType,
      base64: pdf.base64,
    }
  })

  ipcMain.handle(IPC.INVOICE_DELIVER, (_e, payload) => {
    const parsed = parseIpcArg(deliverSchema, payload, 'delivery')
    return deliveryService.deliver({
      invoice: parsed.invoice,
      email: parsed.email || undefined,
      whatsapp: parsed.whatsapp || undefined,
    })
  })

  ipcMain.handle(IPC.COMMUNICATION_STATUS, async () => {
    const settings = await settingsService.getAll()
    return {
      smtpConfigured: isSmtpConfigured(settings),
      greenApiConfigured: isGreenApiConfigured(settings),
      smtpFrom: settings.smtpFrom || '',
      greenApiIdInstance: settings.greenApiIdInstance
        ? `••••${settings.greenApiIdInstance.slice(-4)}`
        : '',
    }
  })

  ipcMain.handle(IPC.COMMUNICATION_TEST_EMAIL, async (_e, payload) => {
    const { to } = parseIpcArg(testEmailSchema, payload, 'testEmail')
    const settings = await settingsService.getAll()
    if (!isSmtpConfigured(settings)) {
      return {
        success: false,
        message: 'SMTP is not configured. Save host, username, password, and From address first.',
      }
    }
    const invoice = sampleInvoice(settings)
    const pdf = pdfService.generate(invoice)
    const result = await createEmailService(settings).sendInvoice({
      to,
      subject: `POS test email from ${settings.storeName || 'POS System'}`,
      bodyText: 'This is a test email from your POS System Communication settings (SMTP).',
      storeName: settings.storeName || 'Store',
      invoiceNo: 'TEST-INV',
      attachment: {
        filename: pdf.filename,
        contentType: pdf.mimeType,
        contentBase64: pdf.base64,
      },
    })
    return { success: result.success, message: result.message, provider: result.provider }
  })

  ipcMain.handle(IPC.COMMUNICATION_TEST_WHATSAPP, async (_e, payload) => {
    const { to } = parseIpcArg(testWhatsAppSchema, payload, 'testWhatsApp')
    const settings = await settingsService.getAll()
    if (!isGreenApiConfigured(settings)) {
      return {
        success: false,
        message: 'Green API is not configured. Save Instance ID and API Token first.',
      }
    }
    const invoice = sampleInvoice(settings)
    const pdf = pdfService.generate(invoice)
    const storeName = settings.storeName || 'Store'
    const result = await createWhatsAppService(settings).sendInvoice({
      to,
      message: `${buildWhatsAppThankYouMessage(storeName)} (test)`,
      storeName,
      invoiceNo: 'TEST-INV',
      pdf: {
        filename: pdf.filename,
        mimeType: pdf.mimeType,
        contentBase64: pdf.base64,
      },
    })
    return { success: result.success, message: result.message, provider: result.provider }
  })
}
