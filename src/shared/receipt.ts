/** Shared receipt payload used by template, ESC/POS, and print preview. */

export type ReceiptPaperWidth = '58' | '80'

export interface ReceiptItem {
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

export interface ReceiptStoreInfo {
  name: string
  address: string
  phone: string
  email: string
  logo: string
  footer: string
  currency: string
}

export interface ReceiptData {
  invoiceNo: string
  createdAt: string
  method: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  taxRate: number
  total: number
  amountReceived: number
  change: number
  note?: string
  store: ReceiptStoreInfo
  paperWidth: ReceiptPaperWidth
}

export interface PrinterInfo {
  name: string
  displayName: string
  description: string
  isDefault: boolean
}
