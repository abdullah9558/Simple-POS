import nodemailer from 'nodemailer'
import type { AppSettings } from '../shared/settings.ts'
import { isSmtpConfigured } from '../shared/settings.ts'
import type { GeneratedInvoicePdf } from './InvoicePdfService.ts'
import { logger } from '../shared/logger.ts'

export interface EmailAttachment {
  filename: string
  contentType: string
  contentBase64: string
}

export interface SendInvoiceEmailInput {
  to: string
  subject: string
  bodyText: string
  storeName: string
  invoiceNo: string
  attachment: EmailAttachment
}

export interface SendEmailResult {
  success: boolean
  provider: 'placeholder' | 'smtp'
  message: string
  preview?: SendInvoiceEmailInput
}

export interface EmailService {
  sendInvoice(input: SendInvoiceEmailInput): Promise<SendEmailResult>
}

export class PlaceholderEmailService implements EmailService {
  async sendInvoice(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
    logger.warn(
      `Email not sent — SMTP not configured (would send ${input.invoiceNo} to ${input.to})`,
      'EmailService',
    )
    return {
      success: false,
      provider: 'placeholder',
      message:
        'Email not sent: SMTP is not configured. Open Settings → Communication and save host, user, password, and From address.',
      preview: input,
    }
  }
}

export class SmtpEmailService implements EmailService {
  constructor(private settings: AppSettings) {}

  async sendInvoice(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
    if (!isSmtpConfigured(this.settings)) {
      return new PlaceholderEmailService().sendInvoice(input)
    }

    const port = parseInt(this.settings.smtpPort, 10) || 587
    const secure = this.settings.smtpSecure === 'true' || port === 465

    try {
      const transporter = nodemailer.createTransport({
        host: this.settings.smtpHost.trim(),
        port,
        secure,
        requireTLS: !secure && port === 587,
        auth: {
          user: this.settings.smtpUser.trim(),
          pass: this.settings.smtpPassword.trim(),
        },
        connectionTimeout: 20_000,
        greetingTimeout: 20_000,
        socketTimeout: 30_000,
      })

      await transporter.verify()

      const info = await transporter.sendMail({
        from: this.settings.smtpFrom.trim(),
        to: input.to,
        subject: input.subject,
        text: input.bodyText,
        attachments: [
          {
            filename: input.attachment.filename,
            content: Buffer.from(input.attachment.contentBase64, 'base64'),
            contentType: input.attachment.contentType,
          },
        ],
      })

      logger.info(`SMTP accepted message ${info.messageId} → ${input.to}`, 'EmailService')
      return {
        success: true,
        provider: 'smtp',
        message: `Invoice emailed to ${input.to}`,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`SMTP send failed: ${message}`, 'EmailService', err)
      return {
        success: false,
        provider: 'smtp',
        message: `Email failed: ${message}`,
      }
    }
  }
}

export function createEmailService(settings: AppSettings): EmailService {
  return isSmtpConfigured(settings)
    ? new SmtpEmailService(settings)
    : new PlaceholderEmailService()
}

export function attachmentFromPdf(pdf: GeneratedInvoicePdf): EmailAttachment {
  return {
    filename: pdf.filename,
    contentType: pdf.mimeType,
    contentBase64: pdf.base64,
  }
}
