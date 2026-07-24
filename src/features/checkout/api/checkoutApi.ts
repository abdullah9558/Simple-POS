import type { CompleteSaleInput } from '../schemas/checkoutSchema'
import { completeSaleSchema } from '../schemas/checkoutSchema'
import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke } from '../../../lib/ipc'
import type { InvoiceDeliveryResult } from '../../../shared/invoice'

export interface SaleResult {
  id: string
  invoiceNo: string
  total: number
  method: string
  itemCount: number
  change: number
  createdAt: string
  subtotal?: number
  tax?: number
  discount?: number
  customerId?: string | null
  customerName?: string | null
  delivery?: InvoiceDeliveryResult
}

export async function completeSale(input: CompleteSaleInput): Promise<SaleResult> {
  const parsed = completeSaleSchema.parse(input)

  const sale = await ipcInvoke<{
    id: string
    invoiceNo: string
    total: number
    method: string
    subtotal: number
    tax: number
    discount: number
    createdAt: Date | string
    customerId?: string | null
    customer?: { name: string } | null
    items: Array<{ quantity: number }>
    delivery?: InvoiceDeliveryResult
  }>(IPC.SALE_CREATE, {
    items: parsed.items,
    method: parsed.method,
    discount: parsed.discount,
    taxRate: parsed.taxRate,
    note: parsed.note || undefined,
    customerId: parsed.customerId || undefined,
    contact: parsed.contact
      ? {
          name: parsed.contact.name || undefined,
          phone: parsed.contact.phone || undefined,
          whatsapp: parsed.contact.whatsapp || undefined,
          email: parsed.contact.email || undefined,
          sendDigitalReceipt: parsed.contact.sendDigitalReceipt,
        }
      : undefined,
  })

  const itemCount = sale.items?.reduce((sum, i) => sum + i.quantity, 0)
    ?? parsed.items.reduce((sum, i) => sum + i.quantity, 0)

  return {
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    total: sale.total,
    method: sale.method,
    itemCount,
    change: Math.max(0, parsed.amountReceived - sale.total),
    createdAt: typeof sale.createdAt === 'string' ? sale.createdAt : new Date(sale.createdAt).toISOString(),
    subtotal: sale.subtotal,
    tax: sale.tax,
    discount: sale.discount,
    customerId: sale.customerId ?? null,
    customerName: sale.customer?.name ?? parsed.contact?.name ?? null,
    delivery: sale.delivery,
  }
}
