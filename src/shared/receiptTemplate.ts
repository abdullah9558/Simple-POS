import { EscPosBuilder, paperChars } from './escpos.ts'
import type { ReceiptData } from './receipt.ts'

function money(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: 'Rs',
    AED: 'AED',
    SAR: 'SAR',
  }
  const code = (currency || 'USD').toUpperCase()
  const symbol = symbols[code] ?? code
  const formatted = amount.toFixed(2)
  return symbol.length === 1 ? `${symbol}${formatted}` : `${symbol} ${formatted}`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

/** Build ESC/POS thermal receipt bytes (base64). */
export function buildEscPosReceipt(data: ReceiptData): string {
  const w = paperChars(data.paperWidth)
  const esc = new EscPosBuilder(w)
  const cur = data.store.currency || 'USD'

  esc.init().align('center').bold(true).doubleHeight(true)
  esc.line(data.store.name || 'SimplePOS')
  esc.bold(false).doubleHeight(false)

  if (data.store.address) esc.line(data.store.address)
  if (data.store.phone) esc.line(data.store.phone)
  if (data.store.email) esc.line(data.store.email)

  esc.separator('=')
  esc.align('left')
  esc.line(`Invoice: ${data.invoiceNo}`)
  esc.line(`Date: ${formatDate(data.createdAt)}`)
  esc.line(`Payment: ${data.method}`)
  esc.separator()

  for (const item of data.items) {
    esc.line(item.name)
    const left = `  ${item.quantity} x ${money(item.price, cur)}`
    esc.columns(left, money(item.total, cur))
  }

  esc.separator()
  esc.columns('Subtotal', money(data.subtotal, cur))
  if (data.discount > 0) esc.columns('Discount', `-${money(data.discount, cur)}`)
  if (data.tax > 0) {
    esc.columns(`Tax (${(data.taxRate * 100).toFixed(1)}%)`, money(data.tax, cur))
  }
  esc.bold(true)
  esc.columns('TOTAL', money(data.total, cur))
  esc.bold(false)

  if (data.method === 'CASH') {
    esc.columns('Received', money(data.amountReceived, cur))
    esc.columns('Change', money(data.change, cur))
  }

  if (data.note) {
    esc.separator()
    esc.line(`Note: ${data.note}`)
  }

  esc.separator('=')
  esc.align('center')
  if (data.store.footer) {
    for (const line of data.store.footer.split('\n')) {
      if (line.trim()) esc.line(line.trim())
    }
  }
  esc.feed(1).cut()
  return esc.toBase64()
}

/** HTML document for thermal print / preview. */
export function buildReceiptHtml(data: ReceiptData): string {
  const cur = data.store.currency || 'USD'
  const widthPx = data.paperWidth === '58' ? 220 : 300
  const fmt = (n: number) => money(n, cur)

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td class="item-name">${escapeHtml(item.name)}<div class="sku">${escapeHtml(item.sku)}</div></td>
        <td class="qty">${item.quantity}</td>
        <td class="price">${fmt(item.total)}</td>
      </tr>`,
    )
    .join('')

  const logoHtml = data.store.logo
    ? `<img class="logo" src="${data.store.logo}" alt="" />`
    : ''

  const footerLines = (data.store.footer || '')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `<div>${escapeHtml(l.trim())}</div>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${escapeHtml(data.invoiceNo)}</title>
<style>
  @page { margin: 0; size: ${data.paperWidth}mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    color: #111;
    background: #fff;
    width: ${widthPx}px;
    margin: 0 auto;
    padding: 8px;
  }
  .center { text-align: center; }
  .logo { max-width: 72px; max-height: 72px; margin: 0 auto 6px; display: block; object-fit: contain; }
  .store-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .muted { color: #444; font-size: 11px; line-height: 1.35; }
  .rule { border: none; border-top: 1px dashed #333; margin: 8px 0; }
  .rule-solid { border: none; border-top: 1px solid #111; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 2px 0; }
  .item-name { text-align: left; }
  .sku { font-size: 10px; color: #666; }
  .qty { text-align: center; width: 28px; }
  .price { text-align: right; white-space: nowrap; }
  .totals td { padding: 1px 0; }
  .totals .label { text-align: left; }
  .totals .value { text-align: right; }
  .total-row { font-weight: 700; font-size: 13px; }
  .footer { margin-top: 10px; font-size: 11px; line-height: 1.4; }
</style>
</head>
<body>
  <div class="center">
    ${logoHtml}
    <div class="store-name">${escapeHtml(data.store.name || 'SimplePOS')}</div>
    <div class="muted">
      ${data.store.address ? `<div>${escapeHtml(data.store.address)}</div>` : ''}
      ${data.store.phone ? `<div>${escapeHtml(data.store.phone)}</div>` : ''}
      ${data.store.email ? `<div>${escapeHtml(data.store.email)}</div>` : ''}
    </div>
  </div>
  <hr class="rule-solid" />
  <div class="muted">
    <div>Invoice: ${escapeHtml(data.invoiceNo)}</div>
    <div>Date: ${escapeHtml(formatDate(data.createdAt))}</div>
    <div>Payment: ${escapeHtml(data.method)}</div>
  </div>
  <hr class="rule" />
  <table>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr class="rule" />
  <table class="totals">
    <tr><td class="label">Subtotal</td><td class="value">${fmt(data.subtotal)}</td></tr>
    ${data.discount > 0 ? `<tr><td class="label">Discount</td><td class="value">-${fmt(data.discount)}</td></tr>` : ''}
    ${data.tax > 0 ? `<tr><td class="label">Tax (${(data.taxRate * 100).toFixed(1)}%)</td><td class="value">${fmt(data.tax)}</td></tr>` : ''}
    <tr class="total-row"><td class="label">TOTAL</td><td class="value">${fmt(data.total)}</td></tr>
    ${
      data.method === 'CASH'
        ? `<tr><td class="label">Received</td><td class="value">${fmt(data.amountReceived)}</td></tr>
           <tr><td class="label">Change</td><td class="value">${fmt(data.change)}</td></tr>`
        : ''
    }
  </table>
  ${data.note ? `<hr class="rule" /><div class="muted">Note: ${escapeHtml(data.note)}</div>` : ''}
  <hr class="rule-solid" />
  <div class="center footer">${footerLines}</div>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
