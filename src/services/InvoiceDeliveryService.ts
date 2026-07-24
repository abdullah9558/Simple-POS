import type { InvoiceData, InvoiceDeliveryResult, DeliveryChannelStatus } from '../shared/invoice.ts'
import { InvoicePdfService } from './InvoicePdfService.ts'
import {
  createEmailService,
  attachmentFromPdf,
  type EmailService,
  type SendEmailResult,
} from './EmailService.ts'
// WhatsApp temporarily disabled
// import {
//   createWhatsAppService,
//   buildWhatsAppThankYouMessage,
//   whatsappPdfFromGenerated,
//   type WhatsAppService,
//   type SendWhatsAppResult,
// } from './WhatsAppService.ts'
import { SettingsService } from './SettingsService.ts'

export interface DeliverInvoiceOptions {
  invoice: InvoiceData
  email?: string
  whatsapp?: string
}

function toChannelStatus(result: SendEmailResult /* | SendWhatsAppResult */): {
  status: DeliveryChannelStatus
  message: string
} {
  if (!result.success) {
    return { status: 'failed', message: result.message }
  }
  return { status: 'sent', message: result.message }
}

/**
 * Orchestrates PDF generation and optional email / WhatsApp delivery.
 * WhatsApp path is temporarily disabled (code retained below / commented).
 */
export class InvoiceDeliveryService {
  private pdfService: InvoicePdfService
  private settingsService: SettingsService
  private emailService?: EmailService
  // private whatsappService?: WhatsAppService

  constructor(
    pdfService = new InvoicePdfService(),
    settingsService = new SettingsService(),
    emailService?: EmailService,
    // whatsappService?: WhatsAppService,
  ) {
    this.pdfService = pdfService
    this.settingsService = settingsService
    this.emailService = emailService
    // this.whatsappService = whatsappService
  }

  async deliver(options: DeliverInvoiceOptions): Promise<InvoiceDeliveryResult> {
    const { invoice, email, whatsapp } = options
    const wantsEmail = Boolean(email?.trim())
    // WhatsApp receipt temporarily disabled
    const wantsWhatsApp = false
    // const wantsWhatsApp = Boolean(whatsapp?.trim())
    void whatsapp

    if (!wantsEmail && !wantsWhatsApp) {
      return {
        pdfGenerated: false,
        email: { status: 'skipped', message: 'No email provided' },
        whatsapp: { status: 'skipped', message: 'WhatsApp delivery temporarily disabled' },
        // whatsapp: { status: 'skipped', message: 'No WhatsApp number provided' },
      }
    }

    let pdfGenerated = false
    try {
      const settings = await this.settingsService.getAll()
      const emailService = this.emailService ?? createEmailService(settings)
      // const whatsappService = this.whatsappService ?? createWhatsAppService(settings)

      const pdf = this.pdfService.generate(invoice)
      pdfGenerated = true
      const storeName = invoice.store.name || 'our store'

      const emailResult = wantsEmail
        ? await emailService.sendInvoice({
            to: email!.trim(),
            subject: `Invoice ${invoice.invoiceNo} from ${storeName}`,
            bodyText: [
              `Thank you for shopping with ${storeName}.`,
              '',
              `Invoice: ${invoice.invoiceNo}`,
              `Total: ${invoice.store.currency} ${invoice.total.toFixed(2)}`,
              `Payment: ${invoice.method}`,
              `Cashier: ${invoice.cashierName}`,
              `Date: ${new Date(invoice.createdAt).toLocaleString()}`,
              '',
              invoice.thankYouMessage,
            ].join('\n'),
            storeName,
            invoiceNo: invoice.invoiceNo,
            attachment: attachmentFromPdf(pdf),
          })
        : null

      // WhatsApp receipt temporarily disabled
      // const whatsappResult = wantsWhatsApp
      //   ? await whatsappService.sendInvoice({
      //       to: whatsapp!.trim(),
      //       message: buildWhatsAppThankYouMessage(storeName),
      //       storeName,
      //       invoiceNo: invoice.invoiceNo,
      //       pdf: whatsappPdfFromGenerated(pdf),
      //     })
      //   : null

      return {
        pdfGenerated,
        email: emailResult
          ? toChannelStatus(emailResult)
          : { status: 'skipped', message: 'No email provided' },
        whatsapp: { status: 'skipped', message: 'WhatsApp delivery temporarily disabled' },
        // whatsapp: whatsappResult
        //   ? toChannelStatus(whatsappResult)
        //   : { status: 'skipped', message: 'No WhatsApp number provided' },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invoice delivery failed'
      return {
        pdfGenerated,
        email: wantsEmail
          ? { status: 'failed', message }
          : { status: 'skipped', message: 'No email provided' },
        whatsapp: { status: 'skipped', message: 'WhatsApp delivery temporarily disabled' },
        // whatsapp: wantsWhatsApp
        //   ? { status: 'failed', message }
        //   : { status: 'skipped', message: 'No WhatsApp number provided' },
      }
    }
  }
}
