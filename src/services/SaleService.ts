import { SaleRepository, type SaleFilters } from './repositories/index.ts'
import { ProductRepository } from './repositories/index.ts'
import { CustomerService } from './CustomerService.ts'
import { SettingsService } from './SettingsService.ts'
import { InvoiceDeliveryService } from './InvoiceDeliveryService.ts'
import type { CheckoutContactInput, InvoiceDeliveryResult } from '../shared/invoice.ts'

export interface SaleItemInput {
  productId: string
  quantity: number
}

export interface CreateSaleOptions {
  customerId?: string
  userId?: string
  method?: 'CASH' | 'CARD' | 'MOBILE'
  discount?: number
  taxRate?: number
  note?: string
  items: SaleItemInput[]
  /** Optional checkout contact capture for digital invoice delivery. */
  contact?: CheckoutContactInput
}

export class SaleService {
  private saleRepo = new SaleRepository()
  private productRepo = new ProductRepository()
  private customerService = new CustomerService()
  private settingsService = new SettingsService()
  private deliveryService = new InvoiceDeliveryService()

  async getAll(filters?: SaleFilters) {
    return this.saleRepo.findAll(filters)
  }

  async getById(id: string) {
    const sale = await this.saleRepo.findById(id)
    if (!sale) throw new Error(`Sale not found: ${id}`)
    return sale
  }

  async create(options: CreateSaleOptions) {
    if (options.items.length === 0) throw new Error('Sale must have at least one item')

    const contact = options.contact
    if (contact?.sendDigitalReceipt) {
      // WhatsApp temporarily disabled — email only
      const hasChannel = Boolean(contact.email?.trim())
      // const hasChannel = Boolean(contact.email?.trim() || contact.whatsapp?.trim())
      if (!hasChannel) {
        throw new Error('Provide an email address to send a digital receipt')
        // throw new Error('Provide a WhatsApp number or email to send a digital receipt')
      }
    }

    let customerId = options.customerId
    if (!customerId && contact) {
      const customer = await this.customerService.findOrCreateFromCheckoutContact(contact)
      customerId = customer?.id
    }

    const resolvedItems = []
    for (const item of options.items) {
      const product = await this.productRepo.findById(item.productId)
      if (!product) throw new Error(`Product not found: ${item.productId}`)
      if (!product.isActive) throw new Error(`Product is inactive: ${product.name}`)
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}: available ${product.stock}, requested ${item.quantity}`)
      }

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: product.price * item.quantity,
        name: product.name,
        sku: product.sku,
      })
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.total, 0)
    const discount = options.discount ?? 0
    const taxRate = options.taxRate ?? 0
    const taxableAmount = subtotal - discount
    const tax = Math.round(taxableAmount * taxRate * 100) / 100
    const total = taxableAmount + tax

    const invoiceNo = await this.saleRepo.getNextInvoiceNo()

    const sale = await this.saleRepo.create({
      invoiceNo,
      customerId,
      userId: options.userId,
      subtotal,
      tax,
      discount,
      total,
      method: options.method ?? 'CASH',
      note: options.note,
      items: resolvedItems.map(({ productId, quantity, price, total: lineTotal }) => ({
        productId,
        quantity,
        price,
        total: lineTotal,
      })),
    })

    let delivery: InvoiceDeliveryResult | undefined
    // WhatsApp temporarily disabled — deliver on email only
    const shouldDeliver = Boolean(
      contact?.sendDigitalReceipt && contact.email?.trim(),
    )
    // const shouldDeliver = Boolean(
    //   contact?.sendDigitalReceipt && (contact.email?.trim() || contact.whatsapp?.trim()),
    // )

    if (shouldDeliver) {
      const settings = await this.settingsService.getAll()
      const storeName = settings.storeName || 'Store'
      const thankYou =
        settings.receiptFooter?.trim() ||
        `Thank you for shopping with ${storeName}!`

      delivery = await this.deliveryService.deliver({
        email: contact?.email,
        // whatsapp: contact?.whatsapp,
        whatsapp: undefined, // WhatsApp receipt temporarily disabled
        invoice: {
          invoiceNo: sale.invoiceNo,
          createdAt:
            typeof sale.createdAt === 'string'
              ? sale.createdAt
              : sale.createdAt.toISOString(),
          method: sale.method,
          cashierName: sale.user?.name || 'Cashier',
          customerName: sale.customer?.name || contact?.name || undefined,
          items: resolvedItems.map((item) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          taxRate,
          total: sale.total,
          note: sale.note ?? undefined,
          store: {
            name: storeName,
            address: settings.storeAddress || '',
            phone: settings.storePhone || '',
            email: settings.storeEmail || '',
            footer: settings.receiptFooter || '',
            currency: settings.currency || 'USD',
          },
          thankYouMessage: thankYou,
        },
      })
    }

    return { ...sale, delivery }
  }

  async refund(id: string) {
    const sale = await this.getById(id)
    if (sale.status === 'REFUNDED') throw new Error('Sale is already refunded')
    return this.saleRepo.refund(id)
  }

  async getTodaySummary() {
    return this.saleRepo.getTodaySummary()
  }

  async count(filters?: SaleFilters) {
    return this.saleRepo.count(filters)
  }
}
