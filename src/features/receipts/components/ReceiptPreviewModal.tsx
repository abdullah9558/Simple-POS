import { useState, useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import { getReceiptPreviewHtml, printReceipt, printThermalReceipt, getEscPosPayload } from '../api/printApi'
import type { ReceiptData } from '../../../shared/receipt'

interface Props {
  open: boolean
  data: ReceiptData | null
  printerName?: string
  printMode?: 'html' | 'escpos'
  onClose: () => void
}

export default function ReceiptPreviewModal({ open, data, printMode = 'html', onClose }: Props) {
  const { toast } = useToast()
  const [printing, setPrinting] = useState(false)
  const [showEscPos, setShowEscPos] = useState(false)
  const [escposPreview, setEscposPreview] = useState('')

  const html = data ? getReceiptPreviewHtml(data) : ''

  const handlePrint = useCallback(async () => {
    if (!data) return
    setPrinting(true)
    try {
      if (printMode === 'escpos') {
        const result = await printThermalReceipt(data, { mode: 'escpos' })
        setEscposPreview(result.escpos)
        setShowEscPos(true)
      }
      // Always show the OS print dialog — silent/deviceName printing often fails
      // when the configured printer name is wrong or the driver rejects silent jobs.
      await printReceipt(data, { silent: false })
      toast('Print dialog opened — choose your printer and confirm', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Print failed', 'error')
    } finally {
      setPrinting(false)
    }
  }, [data, printMode, toast])

  const handleCopyEscPos = useCallback(async () => {
    if (!data) return
    try {
      const payload = await getEscPosPayload(data)
      setEscposPreview(payload)
      setShowEscPos(true)
      await navigator.clipboard.writeText(payload)
      toast('ESC/POS base64 copied to clipboard', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to copy ESC/POS', 'error')
    }
  }, [data, toast])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receipt Preview"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="secondary" onClick={handleCopyEscPos} disabled={!data}>ESC/POS</Button>
          <Button onClick={handlePrint} loading={printing} disabled={!data}>Print</Button>
        </>
      }
    >
      {!data ? (
        <p className="text-body text-text-muted">No receipt data</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-caption text-text-muted">
            <span>{data.invoiceNo}</span>
            <span>{data.paperWidth}mm thermal</span>
          </div>
          <p className="text-caption text-text-muted">
            Click <strong>Print</strong> to open the system print dialog and select your receipt printer.
          </p>
          <div className="max-h-[55vh] overflow-auto rounded-md border border-border-subtle bg-white p-2">
            <iframe
              title="Receipt preview"
              srcDoc={html}
              className="mx-auto block w-full border-0"
              style={{ height: 520, background: '#fff' }}
              sandbox=""
            />
          </div>
          {showEscPos && escposPreview && (
            <div className="space-y-1">
              <p className="text-caption-medium text-text-secondary">ESC/POS payload (base64)</p>
              <textarea
                readOnly
                value={escposPreview}
                className="h-24 w-full rounded-md border border-border-subtle bg-surface-raised px-2 py-1 font-mono text-[10px] text-text-muted"
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
