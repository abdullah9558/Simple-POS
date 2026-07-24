/** Shared invoice payload for PDF generation and digital delivery. */

export interface InvoiceLineItem {
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

export interface InvoiceStoreInfo {
  name: string
  address: string
  phone: string
  email: string
  footer: string
  currency: string
}

export interface InvoiceData {
  invoiceNo: string
  createdAt: string
  method: string
  cashierName: string
  customerName?: string
  items: InvoiceLineItem[]
  subtotal: number
  discount: number
  tax: number
  taxRate: number
  total: number
  note?: string
  store: InvoiceStoreInfo
  thankYouMessage: string
}

export interface CheckoutContactInput {
  name?: string
  phone?: string
  whatsapp?: string
  email?: string
  sendDigitalReceipt?: boolean
}

export type DeliveryChannelStatus = 'skipped' | 'queued' | 'failed' | 'sent'

export interface DeliveryChannelResult {
  status: DeliveryChannelStatus
  message: string
}

export interface InvoiceDeliveryResult {
  pdfGenerated: boolean
  email: DeliveryChannelResult
  whatsapp: DeliveryChannelResult
}
