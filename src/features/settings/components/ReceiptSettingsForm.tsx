import { useEffect, useState } from 'react'
import { useForm } from '../../../hooks/useForm'
import { receiptSchema, type ReceiptFormData } from '../schemas/settingsSchema'
import { listPrinters } from '../../receipts/api/printApi'
import type { PrinterInfo } from '../../../shared/receipt'

interface Props {
  initialValues: ReceiptFormData
  onSubmit: (data: ReceiptFormData) => void | Promise<void>
  id?: string
}

export default function ReceiptSettingsForm({ initialValues, onSubmit, id = 'receipt-form' }: Props) {
  const form = useForm({ schema: receiptSchema, initialValues, onSubmit })
  const [printers, setPrinters] = useState<PrinterInfo[]>([])

  useEffect(() => {
    void listPrinters().then(setPrinters).catch(() => setPrinters([]))
  }, [])

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-paper" className="text-caption-medium text-text-secondary">Paper Width</label>
          <select
            id="receipt-paper"
            value={form.values.receiptPaperWidth}
            onChange={(e) => form.setValue('receiptPaperWidth', e.target.value as '58' | '80')}
            className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="80">80mm thermal</option>
            <option value="58">58mm thermal</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-mode" className="text-caption-medium text-text-secondary">Print Mode</label>
          <select
            id="receipt-mode"
            value={form.values.receiptPrintMode}
            onChange={(e) => form.setValue('receiptPrintMode', e.target.value as 'html' | 'escpos')}
            className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="html">Thermal HTML</option>
            <option value="escpos">ESC/POS raw</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="receipt-printer" className="text-caption-medium text-text-secondary">Printer</label>
        <select
          id="receipt-printer"
          value={form.values.receiptPrinterName ?? ''}
          onChange={(e) => form.setValue('receiptPrinterName', e.target.value)}
          className="h-9 rounded-md border border-border-subtle bg-surface-raised px-3 text-body focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="">System default / print dialog</option>
          {printers.map((p) => (
            <option key={p.name} value={p.name}>
              {p.displayName}{p.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
        <p className="text-caption text-text-muted">Leave blank to use the OS print dialog</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="receipt-auto"
          checked={form.values.receiptAutoPrint}
          onChange={(e) => form.setValue('receiptAutoPrint', e.target.checked)}
          className="h-4 w-4 rounded accent-accent"
        />
        <label htmlFor="receipt-auto" className="text-body text-text-secondary">
          Auto-print receipt after sale
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="receipt-footer" className="text-caption-medium text-text-secondary">Receipt Footer</label>
        <textarea
          id="receipt-footer"
          value={form.getFieldProps('receiptFooter').value as string}
          onChange={(e) => form.setValue('receiptFooter', e.target.value)}
          onBlur={form.getFieldProps('receiptFooter').onBlur}
          rows={4}
          placeholder="Thank you for your purchase!"
          className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
        />
        <p className="text-caption text-text-muted">Displayed at the bottom of printed receipts</p>
      </div>
    </form>
  )
}
