import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  stock: number
}

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE'

export interface CartSummary {
  subtotal: number
  discount: number
  taxRate: number
  tax: number
  total: number
  itemCount: number
}

interface CartState {
  items: CartItem[]
  discount: number
  taxRate: number
  paymentMethod: PaymentMethod
  amountReceived: number
  note: string
  processing: boolean

  addItem: (product: { id: string; name: string; sku: string; price: number; stock: number }) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setDiscount: (amount: number) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setAmountReceived: (amount: number) => void
  setNote: (note: string) => void
  setProcessing: (processing: boolean) => void
  getSummary: () => CartSummary
  getChange: () => number
}

function computeSummary(items: CartItem[], discount: number, taxRate: number): CartSummary {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const clampedDiscount = Math.min(Math.max(discount, 0), subtotal)
  const taxableAmount = subtotal - clampedDiscount
  const tax = Math.round(taxableAmount * taxRate * 100) / 100
  const total = Math.round((taxableAmount + tax) * 100) / 100
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  return { subtotal, discount: clampedDiscount, taxRate, tax, total, itemCount }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  taxRate: 0.05,
  paymentMethod: 'CASH',
  amountReceived: 0,
  note: '',
  processing: false,

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return state
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        }
      }
      if (product.stock <= 0) return state
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: 1,
            stock: product.stock,
          },
        ],
      }
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      const clamped = Math.max(1, quantity)
      return {
        items: state.items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(clamped, i.stock) }
            : i,
        ),
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  clearCart: () =>
    set({ items: [], discount: 0, amountReceived: 0, note: '', processing: false }),

  setDiscount: (amount) => set({ discount: Math.max(0, amount) }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setAmountReceived: (amount) => set({ amountReceived: Math.max(0, amount) }),

  setNote: (note) => set({ note }),

  setProcessing: (processing) => set({ processing }),

  getSummary: () => {
    const { items, discount, taxRate } = get()
    return computeSummary(items, discount, taxRate)
  },

  getChange: () => {
    const { amountReceived } = get()
    const summary = get().getSummary()
    return Math.max(0, Math.round((amountReceived - summary.total) * 100) / 100)
  },
}))
