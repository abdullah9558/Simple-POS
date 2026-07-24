import { jsPDF } from 'jspdf'
import type { InvoiceData } from '../shared/invoice.ts'

export interface GeneratedInvoicePdf {
  filename: string
  mimeType: 'application/pdf'
  /** Raw PDF bytes suitable for attachments / filesystem write. */
  buffer: Buffer
  /** Base64 for IPC transport when needed. */
  base64: string
}

/**
 * Builds a professional A4 invoice PDF from structured sale data.
 */
export class InvoicePdfService {
  generate(invoice: InvoiceData): GeneratedInvoicePdf {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 16
    let y = 18

    const currency = invoice.store.currency || 'USD'
    const money = (n: number) =>
      `${currency} ${n.toFixed(2)}`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(invoice.store.name || 'Store', margin, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y += 7
    if (invoice.store.address) {
      doc.text(invoice.store.address, margin, y)
      y += 5
    }
    const contactLine = [invoice.store.phone, invoice.store.email].filter(Boolean).join('  ·  ')
    if (contactLine) {
      doc.text(contactLine, margin, y)
      y += 5
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('INVOICE', pageWidth - margin, 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(invoice.invoiceNo, pageWidth - margin, 25, { align: 'right' })
    doc.text(this.formatDateTime(invoice.createdAt), pageWidth - margin, 31, { align: 'right' })

    y = Math.max(y + 6, 40)
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.text('Bill To', margin, y)
    doc.text('Payment', pageWidth / 2, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.customerName || 'Walk-in Customer', margin, y)
    doc.text(invoice.method, pageWidth / 2, y)
    y += 5
    doc.text(`Cashier: ${invoice.cashierName || 'Cashier'}`, pageWidth / 2, y)
    y += 10

    // Table header
    const cols = {
      item: margin,
      qty: pageWidth - margin - 70,
      price: pageWidth - margin - 42,
      total: pageWidth - margin,
    }

    doc.setFillColor(245, 247, 250)
    doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Item', cols.item, y)
    doc.text('Qty', cols.qty, y, { align: 'right' })
    doc.text('Price', cols.price, y, { align: 'right' })
    doc.text('Total', cols.total, y, { align: 'right' })
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    for (const item of invoice.items) {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      const label = item.sku ? `${item.name} (${item.sku})` : item.name
      const lines = doc.splitTextToSize(label, cols.qty - cols.item - 4) as string[]
      doc.text(lines, cols.item, y)
      doc.text(String(item.quantity), cols.qty, y, { align: 'right' })
      doc.text(money(item.price), cols.price, y, { align: 'right' })
      doc.text(money(item.total), cols.total, y, { align: 'right' })
      y += Math.max(6, lines.length * 4.5)
    }

    y += 4
    doc.setDrawColor(220)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    const totalsX = pageWidth - margin
    const labelX = pageWidth - margin - 55
    const row = (label: string, value: string, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(label, labelX, y, { align: 'right' })
      doc.text(value, totalsX, y, { align: 'right' })
      y += 6
    }

    row('Subtotal', money(invoice.subtotal))
    if (invoice.discount > 0) row('Discount', `-${money(invoice.discount)}`)
    if (invoice.tax > 0) {
      const taxLabel = invoice.taxRate > 0
        ? `Tax (${(invoice.taxRate * 100).toFixed(1)}%)`
        : 'Tax'
      row(taxLabel, money(invoice.tax))
    }
    row('Total', money(invoice.total), true)

    y += 8
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    const thankYou = doc.splitTextToSize(
      invoice.thankYouMessage || invoice.store.footer || 'Thank you for your purchase!',
      pageWidth - margin * 2,
    ) as string[]
    doc.text(thankYou, margin, y)

    if (invoice.note) {
      y += thankYou.length * 5 + 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Note: ${invoice.note}`, margin, y)
    }

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
    const buffer = Buffer.from(arrayBuffer)
    const filename = `${invoice.invoiceNo.replace(/[^\w.-]+/g, '_')}.pdf`

    return {
      filename,
      mimeType: 'application/pdf',
      buffer,
      base64: buffer.toString('base64'),
    }
  }

  private formatDateTime(iso: string): string {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return date.toLocaleString()
  }
}
