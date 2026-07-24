import { Blob } from 'node:buffer'
import type { AppSettings } from '../shared/settings.ts'
import { isGreenApiConfigured } from '../shared/settings.ts'
import type { GeneratedInvoicePdf } from './InvoicePdfService.ts'
import { logger } from '../shared/logger.ts'

export interface SendInvoiceWhatsAppInput {
  to: string
  message: string
  storeName: string
  invoiceNo: string
  pdf: {
    filename: string
    mimeType: string
    contentBase64: string
  }
}

export interface SendWhatsAppResult {
  success: boolean
  provider: 'placeholder' | 'green-api'
  message: string
  preview?: SendInvoiceWhatsAppInput
}

export interface WhatsAppService {
  sendInvoice(input: SendInvoiceWhatsAppInput): Promise<SendWhatsAppResult>
}

export class PlaceholderWhatsAppService implements WhatsAppService {
  async sendInvoice(input: SendInvoiceWhatsAppInput): Promise<SendWhatsAppResult> {
    logger.warn(
      `WhatsApp not sent — Green API not configured (would send ${input.invoiceNo} to ${input.to})`,
      'WhatsAppService',
    )
    return {
      success: false,
      provider: 'placeholder',
      message:
        'WhatsApp not sent: Green API is not configured. Open Settings → Communication and save Instance ID + API Token.',
      preview: input,
    }
  }
}

type GreenApiErrorBody = {
  idMessage?: string
  urlFile?: string
  message?: string
  error?: string
}

export class GreenApiWhatsAppService implements WhatsAppService {
  constructor(private settings: AppSettings) {}

  async sendInvoice(input: SendInvoiceWhatsAppInput): Promise<SendWhatsAppResult> {
    if (!isGreenApiConfigured(this.settings)) {
      return new PlaceholderWhatsAppService().sendInvoice(input)
    }

    const chatId = toGreenApiChatId(input.to)
    if (!chatId) {
      return {
        success: false,
        provider: 'green-api',
        message: 'Invalid WhatsApp number — use digits with country code (e.g. 923001234567)',
      }
    }

    const idInstance = this.settings.greenApiIdInstance.trim()
    const token = this.settings.greenApiTokenInstance.trim()
    const mediaBase = (this.settings.greenApiMediaUrl || 'https://media.green-api.com').replace(/\/+$/, '')
    const filename = input.pdf.filename.endsWith('.pdf')
      ? input.pdf.filename
      : `${input.pdf.filename}.pdf`

    try {
      const buffer = Buffer.from(input.pdf.contentBase64, 'base64')
      const form = new FormData()
      form.append('chatId', chatId)
      form.append('caption', input.message.slice(0, 1024))
      form.append('fileName', filename)
      const bytes = new Uint8Array(buffer)
      const file = typeof File !== 'undefined'
        ? new File([bytes], filename, { type: 'application/pdf' })
        : new Blob([bytes], { type: 'application/pdf' })
      form.append('file', file, filename)

      const url = `${mediaBase}/waInstance${idInstance}/sendFileByUpload/${token}`
      const res = await fetch(url, { method: 'POST', body: form })
      const json = (await res.json().catch(() => ({}))) as GreenApiErrorBody

      if (!res.ok || !json.idMessage) {
        const errText = json.message || json.error || `Green API failed (${res.status})`
        throw new Error(errText)
      }

      logger.info(`Green API WhatsApp sent ${json.idMessage} → ${chatId}`, 'WhatsAppService')
      return {
        success: true,
        provider: 'green-api',
        message: `Invoice sent on WhatsApp to ${normalizeWhatsAppNumber(input.to)}`,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`Green API WhatsApp failed: ${message}`, 'WhatsAppService', err)
      return {
        success: false,
        provider: 'green-api',
        message: `WhatsApp failed: ${message}`,
      }
    }
  }
}

export function createWhatsAppService(settings: AppSettings): WhatsAppService {
  return isGreenApiConfigured(settings)
    ? new GreenApiWhatsAppService(settings)
    : new PlaceholderWhatsAppService()
}

export function whatsappPdfFromGenerated(pdf: GeneratedInvoicePdf) {
  return {
    filename: pdf.filename,
    mimeType: pdf.mimeType,
    contentBase64: pdf.base64,
  }
}

export function buildWhatsAppThankYouMessage(storeName: string): string {
  return `Thank you for shopping with ${storeName}. Your invoice is attached.`
}

export function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Green API chat id: 923001234567@c.us */
export function toGreenApiChatId(raw: string): string | null {
  const digits = normalizeWhatsAppNumber(raw)
  if (digits.length < 8) return null
  return `${digits}@c.us`
}
