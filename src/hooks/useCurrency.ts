import { useCallback, useMemo } from 'react'
import { useSettings } from '../features/settings/hooks/useSettings'
import {
  formatCurrency as formatCurrencyValue,
  getCurrencySymbol,
  normalizeCurrency,
} from '../lib/format'

export function useCurrency() {
  const { data: settings } = useSettings()
  const currency = normalizeCurrency(settings?.currency)

  const formatCurrency = useCallback(
    (value: number) => formatCurrencyValue(value, currency),
    [currency],
  )

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])

  return { currency, currencySymbol, formatCurrency }
}
