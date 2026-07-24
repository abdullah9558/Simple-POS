export interface AppSettings {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  storeLogo: string
  currency: string
  taxRate: string
  taxEnabled: string
  receiptFooter: string
  receiptPaperWidth: string
  receiptAutoPrint: string
  receiptPrinterName: string
  receiptPrintMode: string
  theme: string
  lowStockThreshold: string
  authSessionTimeout: string
  authMinPasswordLength: string
  cloudApiBaseUrl: string
  /** SMTP (nodemailer) */
  smtpHost: string
  smtpPort: string
  smtpSecure: string
  smtpUser: string
  smtpPassword: string
  smtpFrom: string
  /** Green API WhatsApp */
  greenApiIdInstance: string
  greenApiTokenInstance: string
  greenApiUrl: string
  greenApiMediaUrl: string
  /** Legacy keys (kept so existing DB rows do not break) */
  resendApiKey: string
  resendFrom: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioWhatsAppFrom: string
  whatsappPhoneNumberId: string
  whatsappAccessToken: string
  whatsappApiVersion: string
}

export type SettingsKey = keyof AppSettings

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'SimplePOS',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeLogo: '',
  currency: 'USD',
  taxRate: '0.05',
  taxEnabled: 'true',
  receiptFooter: 'Thank you for your purchase!',
  receiptPaperWidth: '80',
  receiptAutoPrint: 'false',
  receiptPrinterName: '',
  receiptPrintMode: 'html',
  theme: 'dark',
  lowStockThreshold: '5',
  authSessionTimeout: '480',
  authMinPasswordLength: '6',
  cloudApiBaseUrl: '',
  smtpHost: '',
  smtpPort: '587',
  smtpSecure: 'false',
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: '',
  greenApiIdInstance: '',
  greenApiTokenInstance: '',
  greenApiUrl: 'https://api.green-api.com',
  greenApiMediaUrl: 'https://media.green-api.com',
  resendApiKey: '',
  resendFrom: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioWhatsAppFrom: '',
  whatsappPhoneNumberId: '',
  whatsappAccessToken: '',
  whatsappApiVersion: 'v21.0',
}

export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingsKey[]

export function isSmtpConfigured(
  settings: Pick<AppSettings, 'smtpHost' | 'smtpUser' | 'smtpPassword' | 'smtpFrom'>,
): boolean {
  return Boolean(
    settings.smtpHost?.trim()
    && settings.smtpUser?.trim()
    && settings.smtpPassword?.trim()
    && settings.smtpFrom?.trim(),
  )
}

export function isGreenApiConfigured(
  settings: Pick<AppSettings, 'greenApiIdInstance' | 'greenApiTokenInstance'>,
): boolean {
  return Boolean(settings.greenApiIdInstance?.trim() && settings.greenApiTokenInstance?.trim())
}
