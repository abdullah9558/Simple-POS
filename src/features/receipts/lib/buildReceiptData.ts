import type { AppSettings } from '../../../shared/settings'
import type { ReceiptData, ReceiptPaperWidth } from '../../../shared/receipt'
import type { CartItem } from '../../checkout/store/cartStore'

export interface BuildReceiptInput {
  invoiceNo: string
  createdAt?: string
  method: string
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  taxRate: number
  total: number
  amountReceived: number
  change: number
  note?: string
  settings: Pick<
    AppSettings,
    | 'storeName'
    | 'storeAddress'
    | 'storePhone'
    | 'storeEmail'
    | 'storeLogo'
    | 'receiptFooter'
    | 'currency'
    | 'receiptPaperWidth'
  >
}

export function buildReceiptData(input: BuildReceiptInput): ReceiptData {
  const paperWidth = (input.settings.receiptPaperWidth === '58' ? '58' : '80') as ReceiptPaperWidth
  // Huge base64 logos break Electron data: URL print windows
  const logo = input.settings.storeLogo || ''
  const safeLogo = logo.length > 120_000 ? '' : logo

  return {
    invoiceNo: input.invoiceNo,
    createdAt: input.createdAt ?? new Date().toISOString(),
    method: input.method,
    items: input.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      price: i.price,
      total: Math.round(i.price * i.quantity * 100) / 100,
    })),
    subtotal: input.subtotal,
    discount: input.discount,
    tax: input.tax,
    taxRate: input.taxRate,
    total: input.total,
    amountReceived: input.amountReceived,
    change: input.change,
    note: input.note,
    paperWidth,
    store: {
      name: input.settings.storeName || 'Store',
      address: input.settings.storeAddress || '',
      phone: input.settings.storePhone || '',
      email: input.settings.storeEmail || '',
      logo: safeLogo,
      footer: input.settings.receiptFooter || '',
      currency: input.settings.currency || 'USD',
    },
  }
}
