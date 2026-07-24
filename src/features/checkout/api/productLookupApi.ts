import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'

export interface LookupProduct {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  stock: number
  minStock: number
  isActive: boolean
}

interface RawLookupProduct {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  stock: number
  minStock: number
  isActive: boolean
}

function toLookup(p: RawLookupProduct): LookupProduct {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode ?? '',
    price: p.price,
    stock: p.stock,
    minStock: p.minStock,
    isActive: p.isActive,
  }
}

export async function lookupProductByBarcode(barcode: string): Promise<LookupProduct | null> {
  const code = barcode.trim()
  if (!code || !isElectron()) return null

  try {
    const product = await ipcInvoke<RawLookupProduct>(IPC.PRODUCT_GET_BY_BARCODE, code)
    return toLookup(product)
  } catch {
    return null
  }
}

export async function searchProductsLocal(query: string): Promise<LookupProduct[]> {
  if (!isElectron()) return []

  const q = query.toLowerCase().trim()

  try {
    const products = await ipcInvoke<RawLookupProduct[]>(IPC.PRODUCT_GET_ALL, {
      search: q || undefined,
      isActive: true,
    })
    return products.map(toLookup)
  } catch {
    return []
  }
}
