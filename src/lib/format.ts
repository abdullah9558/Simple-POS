/** Prefer explicit symbols so UI matches Settings regardless of OS locale quirks. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  PKR: 'Rs',
  AED: 'AED',
  SAR: 'SAR',
}

export const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  PKR: 'en-PK',
  AED: 'en-AE',
  SAR: 'en-SA',
}

export function normalizeCurrency(currency?: string | null): string {
  const code = (currency || 'USD').trim().toUpperCase()
  return CURRENCY_SYMBOLS[code] ? code : 'USD'
}

export function getCurrencySymbol(currency = 'USD'): string {
  const code = normalizeCurrency(currency)
  return CURRENCY_SYMBOLS[code] ?? code
}

export function formatCurrency(value: number, currency = 'USD'): string {
  const code = normalizeCurrency(currency)
  const symbol = getCurrencySymbol(code)
  const amount = Number.isFinite(value) ? value : 0
  const formatted = amount.toFixed(2)

  // Compact prefix for single-character symbols; spaced for letter codes (Rs, AED…)
  if (symbol.length === 1) return `${symbol}${formatted}`
  return `${symbol} ${formatted}`
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString()
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString()
}
