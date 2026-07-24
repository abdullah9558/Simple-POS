import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../../components/ui'
import { useCurrency } from '../../../hooks/useCurrency'
import { useCartStore } from '../store/cartStore'
import { useCompleteSale } from '../hooks/useCompleteSale'
import ProductSearch from '../components/ProductSearch'
import CartPanel from '../components/CartPanel'
import OrderSummary from '../components/OrderSummary'
import PaymentPanel from '../components/PaymentPanel'
import CustomerContactModal from '../components/CustomerContactModal'
import ReceiptPreviewModal from '../../receipts/components/ReceiptPreviewModal'
import { buildReceiptData } from '../../receipts/lib/buildReceiptData'
import { printThermalReceipt } from '../../receipts/api/printApi'
import { fetchSettings } from '../../settings/api/settingsApi'
import type { ReceiptData } from '../../../shared/receipt'
import type { AppSettings } from '../../../shared/settings'
import { DEFAULT_SETTINGS } from '../../../shared/settings'
import type { CheckoutContactFormData } from '../schemas/checkoutSchema'

export default function CheckoutPage() {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const saleMutation = useCompleteSale()
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    void fetchSettings().then((s) => {
      setSettings(s)
      const taxEnabled = s.taxEnabled === 'true'
      const rate = taxEnabled ? (parseFloat(s.taxRate) || 0) : 0
      useCartStore.setState({ taxRate: rate })
    }).catch(() => { /* keep defaults */ })
  }, [])

  const finalizeSale = useCallback((contact?: CheckoutContactFormData) => {
    const state = useCartStore.getState()
    if (state.items.length === 0) return
    if (state.processing) return

    const summary = state.getSummary()
    const cartSnapshot = {
      items: [...state.items],
      discount: state.discount,
      taxRate: state.taxRate,
      paymentMethod: state.paymentMethod,
      amountReceived: state.amountReceived,
      note: state.note,
      summary,
      change: state.getChange(),
    }

    if (state.paymentMethod === 'CASH' && state.amountReceived < summary.total) {
      toast('Received amount is less than total', 'error')
      setContactOpen(false)
      return
    }

    state.setProcessing(true)

    saleMutation.mutate(
      {
        items: cartSnapshot.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        method: cartSnapshot.paymentMethod,
        discount: cartSnapshot.discount,
        taxRate: cartSnapshot.taxRate,
        amountReceived: cartSnapshot.amountReceived,
        note: cartSnapshot.note || undefined,
        contact,
      },
      {
        onSuccess: async (result) => {
          setContactOpen(false)

          const changeText = cartSnapshot.paymentMethod === 'CASH' && cartSnapshot.change > 0
            ? ` — Change: ${formatCurrency(cartSnapshot.change)}`
            : ''

          toast(
            `Sale ${result.invoiceNo} completed — ${result.itemCount} items for ${formatCurrency(summary.total)} via ${cartSnapshot.paymentMethod}${changeText}`,
            'success',
          )

          if (result.delivery) {
            const parts: string[] = []
            let failed = false
            for (const channel of [result.delivery.email, result.delivery.whatsapp]) {
              if (channel.status === 'skipped') continue
              if (channel.status === 'sent') {
                parts.push(channel.message)
              } else {
                failed = true
                parts.push(channel.message)
              }
            }
            if (parts.length > 0) {
              toast(parts.join(' · '), failed ? 'error' : 'success')
            }
          }

          let latestSettings = settings
          try {
            latestSettings = await fetchSettings()
            setSettings(latestSettings)
          } catch { /* use cached */ }

          const receipt = buildReceiptData({
            invoiceNo: result.invoiceNo,
            createdAt: result.createdAt,
            method: cartSnapshot.paymentMethod,
            items: cartSnapshot.items,
            subtotal: cartSnapshot.summary.subtotal,
            discount: cartSnapshot.summary.discount,
            tax: cartSnapshot.summary.tax,
            taxRate: cartSnapshot.summary.taxRate,
            total: cartSnapshot.summary.total,
            amountReceived: cartSnapshot.amountReceived,
            change: cartSnapshot.change,
            note: cartSnapshot.note || undefined,
            settings: latestSettings,
          })

          setReceiptData(receipt)
          state.clearCart()

          if (latestSettings.receiptAutoPrint === 'true') {
            try {
              await printThermalReceipt(receipt, {
                deviceName: latestSettings.receiptPrinterName || undefined,
                mode: latestSettings.receiptPrintMode === 'escpos' ? 'escpos' : 'html',
              })
              toast('Receipt printed', 'success')
            } catch {
              setPreviewOpen(true)
            }
          } else {
            setPreviewOpen(true)
          }
        },
        onError: (error) => {
          state.setProcessing(false)
          toast(
            error instanceof Error ? error.message : 'Failed to complete sale',
            'error',
          )
        },
      },
    )
  }, [saleMutation, toast, settings, formatCurrency])

  const handlePay = useCallback(() => {
    const state = useCartStore.getState()
    if (state.items.length === 0) return
    if (state.processing) return

    const summary = state.getSummary()
    if (state.paymentMethod === 'CASH' && state.amountReceived < summary.total) {
      toast('Received amount is less than total', 'error')
      return
    }

    setContactOpen(true)
  }, [toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        const { items, processing } = useCartStore.getState()
        if (items.length > 0 && !processing && !contactOpen) {
          e.preventDefault()
          handlePay()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handlePay, contactOpen])

  return (
    <div className="fixed bottom-0 right-0 top-14 left-[var(--spacing-sidebar)] z-0 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)_minmax(280px,340px)] overflow-hidden bg-surface">
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-border-subtle bg-surface" aria-label="Product finder">
        <ProductSearch />
      </section>

      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-surface">
        <CartPanel />
      </main>

      <aside
        className="flex min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden border-l border-border-subtle bg-surface-raised/40 scrollbar-styled"
        aria-label="Payment details"
      >
        <div className="flex flex-1 flex-col justify-between gap-6 p-5">
          <OrderSummary />
          <PaymentPanel
            onPay={handlePay}
            loading={saleMutation.isPending}
          />
        </div>
      </aside>

      <CustomerContactModal
        open={contactOpen}
        loading={saleMutation.isPending}
        onClose={() => {
          if (!saleMutation.isPending) setContactOpen(false)
        }}
        onSkip={() => finalizeSale(undefined)}
        onConfirm={(contact) => finalizeSale(contact)}
      />

      <ReceiptPreviewModal
        open={previewOpen}
        data={receiptData}
        printerName={settings.receiptPrinterName}
        printMode={settings.receiptPrintMode === 'escpos' ? 'escpos' : 'html'}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
