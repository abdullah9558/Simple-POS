import { getPrisma, type TransactionClient } from './prisma.ts'
import { hashPassword } from './auth/password.ts'
import { DEFAULT_SETTINGS, SETTINGS_KEYS, type SettingsKey } from '../shared/settings.ts'

const TAX_RATE = 0.05
const DEMO_PASSWORD = 'Test@123'

function atDaysAgo(daysAgo: number, hour = 10, minute = 0): Date {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

function money(n: number): number {
  return Math.round(n * 100) / 100
}

function saleTotals(subtotal: number, discount = 0): { subtotal: number; discount: number; tax: number; total: number } {
  const taxable = Math.max(0, subtotal - discount)
  const tax = money(taxable * TAX_RATE)
  return { subtotal: money(subtotal), discount: money(discount), tax, total: money(taxable + tax) }
}

const CATEGORY_IDS = {
  beverages: 'demo-cat-beverages',
  snacks: 'demo-cat-snacks',
  dairy: 'demo-cat-dairy',
  bakery: 'demo-cat-bakery',
  household: 'demo-cat-household',
  personal: 'demo-cat-personal',
  produce: 'demo-cat-produce',
} as const

const SUPPLIER_IDS = {
  fresh: 'demo-sup-fresh',
  metro: 'demo-sup-metro',
  apex: 'demo-sup-apex',
} as const

const USER_IDS = {
  admin: 'demo-user-admin',
  manager: 'demo-user-manager',
  cashier: 'demo-user-cashier',
} as const

const PRODUCT_IDS = {
  cola: 'demo-prod-01',
  water: 'demo-prod-02',
  juice: 'demo-prod-03',
  energy: 'demo-prod-04',
  chips: 'demo-prod-05',
  cookies: 'demo-prod-06',
  nuts: 'demo-prod-07',
  candy: 'demo-prod-08',
  milk: 'demo-prod-09',
  yogurt: 'demo-prod-10',
  cheese: 'demo-prod-11',
  butter: 'demo-prod-12',
  bread: 'demo-prod-13',
  croissant: 'demo-prod-14',
  muffin: 'demo-prod-15',
  detergent: 'demo-prod-16',
  paperTowels: 'demo-prod-17',
  trashBags: 'demo-prod-18',
  shampoo: 'demo-prod-19',
  soap: 'demo-prod-20',
  toothpaste: 'demo-prod-21',
  apples: 'demo-prod-22',
  bananas: 'demo-prod-23',
  tomatoes: 'demo-prod-24',
} as const

const CUSTOMER_IDS = [
  'demo-cust-01',
  'demo-cust-02',
  'demo-cust-03',
  'demo-cust-04',
  'demo-cust-05',
  'demo-cust-06',
  'demo-cust-07',
  'demo-cust-08',
  'demo-cust-09',
] as const

type ProductSeed = {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  cost: number
  stock: number
  minStock: number
  categoryId: string
  supplierId: string
  isActive: boolean
}

const PRODUCTS: ProductSeed[] = [
  // Beverages — healthy / low / out
  { id: PRODUCT_IDS.cola, name: 'Cola 330ml', sku: 'BEV-COLA-330', barcode: '8901000001001', price: 1.5, cost: 0.7, stock: 120, minStock: 20, categoryId: CATEGORY_IDS.beverages, supplierId: SUPPLIER_IDS.metro, isActive: true },
  { id: PRODUCT_IDS.water, name: 'Spring Water 500ml', sku: 'BEV-WATER-500', barcode: '8901000001002', price: 1.0, cost: 0.35, stock: 200, minStock: 40, categoryId: CATEGORY_IDS.beverages, supplierId: SUPPLIER_IDS.metro, isActive: true },
  { id: PRODUCT_IDS.juice, name: 'Orange Juice 1L', sku: 'BEV-OJ-1L', barcode: '8901000001003', price: 3.25, cost: 1.8, stock: 8, minStock: 15, categoryId: CATEGORY_IDS.beverages, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.energy, name: 'Energy Drink 250ml', sku: 'BEV-ENRG-250', barcode: '8901000001004', price: 2.75, cost: 1.2, stock: 0, minStock: 12, categoryId: CATEGORY_IDS.beverages, supplierId: SUPPLIER_IDS.apex, isActive: true },
  // Snacks
  { id: PRODUCT_IDS.chips, name: 'Potato Chips 150g', sku: 'SNK-CHIPS-150', barcode: '8901000002001', price: 2.0, cost: 0.9, stock: 85, minStock: 20, categoryId: CATEGORY_IDS.snacks, supplierId: SUPPLIER_IDS.metro, isActive: true },
  { id: PRODUCT_IDS.cookies, name: 'Chocolate Cookies', sku: 'SNK-COOK-CHOC', barcode: '8901000002002', price: 2.5, cost: 1.1, stock: 4, minStock: 10, categoryId: CATEGORY_IDS.snacks, supplierId: SUPPLIER_IDS.metro, isActive: true },
  { id: PRODUCT_IDS.nuts, name: 'Mixed Nuts 200g', sku: 'SNK-NUTS-200', barcode: '8901000002003', price: 4.5, cost: 2.4, stock: 42, minStock: 10, categoryId: CATEGORY_IDS.snacks, supplierId: SUPPLIER_IDS.apex, isActive: true },
  { id: PRODUCT_IDS.candy, name: 'Assorted Candy Bag', sku: 'SNK-CANDY-BAG', barcode: '8901000002004', price: 1.75, cost: 0.6, stock: 60, minStock: 15, categoryId: CATEGORY_IDS.snacks, supplierId: SUPPLIER_IDS.metro, isActive: false },
  // Dairy
  { id: PRODUCT_IDS.milk, name: 'Whole Milk 1L', sku: 'DRY-MILK-1L', barcode: '8901000003001', price: 2.2, cost: 1.3, stock: 36, minStock: 12, categoryId: CATEGORY_IDS.dairy, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.yogurt, name: 'Greek Yogurt 500g', sku: 'DRY-YOG-500', barcode: '8901000003002', price: 3.0, cost: 1.6, stock: 3, minStock: 8, categoryId: CATEGORY_IDS.dairy, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.cheese, name: 'Cheddar Cheese 250g', sku: 'DRY-CHED-250', barcode: '8901000003003', price: 4.75, cost: 2.5, stock: 28, minStock: 8, categoryId: CATEGORY_IDS.dairy, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.butter, name: 'Salted Butter 200g', sku: 'DRY-BUTT-200', barcode: '8901000003004', price: 3.5, cost: 1.9, stock: 0, minStock: 6, categoryId: CATEGORY_IDS.dairy, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  // Bakery
  { id: PRODUCT_IDS.bread, name: 'White Bread Loaf', sku: 'BAK-BREAD-WHT', barcode: '8901000004001', price: 2.0, cost: 0.85, stock: 24, minStock: 10, categoryId: CATEGORY_IDS.bakery, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.croissant, name: 'Butter Croissant', sku: 'BAK-CROI-BUT', barcode: '8901000004002', price: 1.8, cost: 0.7, stock: 5, minStock: 12, categoryId: CATEGORY_IDS.bakery, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.muffin, name: 'Blueberry Muffin', sku: 'BAK-MUFF-BLU', barcode: '8901000004003', price: 2.25, cost: 0.95, stock: 18, minStock: 8, categoryId: CATEGORY_IDS.bakery, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  // Household
  { id: PRODUCT_IDS.detergent, name: 'Laundry Detergent 2L', sku: 'HSH-DET-2L', barcode: '8901000005001', price: 8.5, cost: 4.2, stock: 32, minStock: 8, categoryId: CATEGORY_IDS.household, supplierId: SUPPLIER_IDS.apex, isActive: true },
  { id: PRODUCT_IDS.paperTowels, name: 'Paper Towels 6-Pack', sku: 'HSH-TOWEL-6', barcode: '8901000005002', price: 6.0, cost: 3.1, stock: 2, minStock: 6, categoryId: CATEGORY_IDS.household, supplierId: SUPPLIER_IDS.apex, isActive: true },
  { id: PRODUCT_IDS.trashBags, name: 'Trash Bags 30ct', sku: 'HSH-TRASH-30', barcode: '8901000005003', price: 5.25, cost: 2.4, stock: 45, minStock: 10, categoryId: CATEGORY_IDS.household, supplierId: SUPPLIER_IDS.metro, isActive: true },
  // Personal care
  { id: PRODUCT_IDS.shampoo, name: 'Shampoo 400ml', sku: 'PER-SHAM-400', barcode: '8901000006001', price: 5.5, cost: 2.8, stock: 22, minStock: 8, categoryId: CATEGORY_IDS.personal, supplierId: SUPPLIER_IDS.apex, isActive: true },
  { id: PRODUCT_IDS.soap, name: 'Hand Soap 250ml', sku: 'PER-SOAP-250', barcode: '8901000006002', price: 2.75, cost: 1.1, stock: 50, minStock: 15, categoryId: CATEGORY_IDS.personal, supplierId: SUPPLIER_IDS.metro, isActive: true },
  { id: PRODUCT_IDS.toothpaste, name: 'Toothpaste 100ml', sku: 'PER-TOOTH-100', barcode: '8901000006003', price: 3.25, cost: 1.4, stock: 0, minStock: 10, categoryId: CATEGORY_IDS.personal, supplierId: SUPPLIER_IDS.apex, isActive: false },
  // Produce
  { id: PRODUCT_IDS.apples, name: 'Red Apples 1kg', sku: 'PRD-APPLE-1KG', barcode: '8901000007001', price: 3.5, cost: 1.7, stock: 40, minStock: 15, categoryId: CATEGORY_IDS.produce, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.bananas, name: 'Bananas 1kg', sku: 'PRD-BANANA-1KG', barcode: '8901000007002', price: 1.8, cost: 0.8, stock: 6, minStock: 20, categoryId: CATEGORY_IDS.produce, supplierId: SUPPLIER_IDS.fresh, isActive: true },
  { id: PRODUCT_IDS.tomatoes, name: 'Tomatoes 500g', sku: 'PRD-TOM-500', barcode: '8901000007003', price: 2.4, cost: 1.1, stock: 55, minStock: 15, categoryId: CATEGORY_IDS.produce, supplierId: SUPPLIER_IDS.fresh, isActive: true },
]

const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))

type SaleLine = { productId: string; quantity: number }

function buildSaleItems(lines: SaleLine[]) {
  return lines.map((line) => {
    const product = PRODUCT_BY_ID.get(line.productId)
    if (!product) throw new Error(`Unknown demo product: ${line.productId}`)
    const total = money(product.price * line.quantity)
    return {
      productId: line.productId,
      quantity: line.quantity,
      price: product.price,
      total,
    }
  })
}

/**
 * Seeds representative demo data once when the business database is empty.
 * Idempotent: skips when any products, sales, or customers already exist.
 */
export class DemoDataService {
  private get db() {
    return getPrisma()
  }

  async isBusinessDatabaseEmpty(): Promise<boolean> {
    const counts = await Promise.all([
      this.db.product.count(),
      this.db.sale.count(),
      this.db.customer.count(),
      this.db.category.count(),
      this.db.supplier.count(),
      this.db.purchaseOrder.count(),
      this.db.inventoryMovement.count(),
    ])
    return counts.every((count) => count === 0)
  }

  async seedIfEmpty(): Promise<boolean> {
    if (!(await this.isBusinessDatabaseEmpty())) {
      return false
    }
    await this.seedAll()
    return true
  }

  private async seedAll(): Promise<void> {
    const now = new Date()
    const passwordHash = hashPassword(DEMO_PASSWORD)

    await this.db.$transaction(async (tx) => {
      const userIds = await this.ensureDemoUsers(tx, passwordHash, now)

      await tx.category.createMany({
        data: [
          { id: CATEGORY_IDS.beverages, name: 'Beverages', description: 'Soft drinks, water, and juices', createdAt: atDaysAgo(175), updatedAt: now },
          { id: CATEGORY_IDS.snacks, name: 'Snacks', description: 'Chips, cookies, and treats', createdAt: atDaysAgo(175), updatedAt: now },
          { id: CATEGORY_IDS.dairy, name: 'Dairy', description: 'Milk, yogurt, cheese, and butter', createdAt: atDaysAgo(174), updatedAt: now },
          { id: CATEGORY_IDS.bakery, name: 'Bakery', description: 'Bread and fresh baked goods', createdAt: atDaysAgo(174), updatedAt: now },
          { id: CATEGORY_IDS.household, name: 'Household', description: 'Cleaning and home essentials', createdAt: atDaysAgo(173), updatedAt: now },
          { id: CATEGORY_IDS.personal, name: 'Personal Care', description: 'Hygiene and personal products', createdAt: atDaysAgo(173), updatedAt: now },
          { id: CATEGORY_IDS.produce, name: 'Produce', description: 'Fresh fruit and vegetables', createdAt: atDaysAgo(172), updatedAt: now },
        ],
      })

      await tx.supplier.createMany({
        data: [
          {
            id: SUPPLIER_IDS.fresh,
            name: 'Fresh Valley Distributors',
            email: 'orders@freshvalley.demo',
            phone: '+1-555-0101',
            address: '120 Market Street, Suite 4',
            company: 'Fresh Valley Distributors LLC',
            isActive: true,
            createdAt: atDaysAgo(170),
            updatedAt: now,
          },
          {
            id: SUPPLIER_IDS.metro,
            name: 'Metro Wholesale Co',
            email: 'sales@metrowholesale.demo',
            phone: '+1-555-0102',
            address: '88 Commerce Blvd',
            company: 'Metro Wholesale Co',
            isActive: true,
            createdAt: atDaysAgo(169),
            updatedAt: now,
          },
          {
            id: SUPPLIER_IDS.apex,
            name: 'Apex Supply Partners',
            email: 'support@apexsupply.demo',
            phone: '+1-555-0103',
            address: '45 Industrial Park Rd',
            company: 'Apex Supply Partners Inc',
            isActive: true,
            createdAt: atDaysAgo(168),
            updatedAt: now,
          },
        ],
      })

      await tx.product.createMany({
        data: PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          minStock: p.minStock,
          categoryId: p.categoryId,
          supplierId: p.supplierId,
          isActive: p.isActive,
          createdAt: atDaysAgo(160),
          updatedAt: now,
        })),
      })

      await tx.customer.createMany({
        data: [
          { id: CUSTOMER_IDS[0], name: 'Alice Johnson', email: 'alice.j@example.com', phone: '+1-555-1001', address: '12 Oak Avenue', creditBalance: 25, outstandingBalance: 0, createdAt: atDaysAgo(140), updatedAt: now },
          { id: CUSTOMER_IDS[1], name: 'Brian Smith', email: 'brian.s@example.com', phone: '+1-555-1002', address: '34 Pine Road', creditBalance: 0, outstandingBalance: 48.5, createdAt: atDaysAgo(130), updatedAt: now },
          { id: CUSTOMER_IDS[2], name: 'Carla Diaz', email: 'carla.d@example.com', phone: '+1-555-1003', address: '56 Maple Lane', creditBalance: 10, outstandingBalance: 12.75, createdAt: atDaysAgo(120), updatedAt: now },
          { id: CUSTOMER_IDS[3], name: 'David Chen', email: 'david.c@example.com', phone: '+1-555-1004', address: '78 Cedar Court', creditBalance: 50, outstandingBalance: 0, createdAt: atDaysAgo(110), updatedAt: now },
          { id: CUSTOMER_IDS[4], name: 'Elena Rossi', email: 'elena.r@example.com', phone: '+1-555-1005', address: '9 Birch Street', creditBalance: 0, outstandingBalance: 0, createdAt: atDaysAgo(100), updatedAt: now },
          { id: CUSTOMER_IDS[5], name: 'Farah Khan', email: 'farah.k@example.com', phone: '+1-555-1006', address: '21 Willow Way', creditBalance: 15.5, outstandingBalance: 32, createdAt: atDaysAgo(90), updatedAt: now },
          { id: CUSTOMER_IDS[6], name: 'George Adams', email: 'george.a@example.com', phone: '+1-555-1007', address: '43 Elm Drive', creditBalance: 0, outstandingBalance: 75.25, createdAt: atDaysAgo(80), updatedAt: now },
          { id: CUSTOMER_IDS[7], name: 'Hana Patel', email: 'hana.p@example.com', phone: '+1-555-1008', address: '67 Spruce Place', creditBalance: 100, outstandingBalance: 0, createdAt: atDaysAgo(70), updatedAt: now },
          { id: CUSTOMER_IDS[8], name: 'Ivan Petrov', email: 'ivan.p@example.com', phone: '+1-555-1009', address: '88 Aspen Blvd', creditBalance: 5, outstandingBalance: 18.4, createdAt: atDaysAgo(60), updatedAt: now },
        ],
      })

      await this.seedSettings(tx)
      await this.seedPurchaseOrders(tx, now)
      await this.seedInventoryMovements(tx)
      await this.seedSales(tx, userIds)
    })
  }

  private async ensureDemoUsers(
    tx: TransactionClient,
    passwordHash: string,
    now: Date,
  ): Promise<{ admin: string; manager: string; cashier: string }> {
    const specs = [
      {
        key: 'admin' as const,
        id: USER_IDS.admin,
        name: 'Admin',
        email: 'admin@simplepos.com',
        role: 'ADMIN' as const,
        createdAt: atDaysAgo(180, 9, 0),
      },
      {
        key: 'manager' as const,
        id: USER_IDS.manager,
        name: 'Manager',
        email: 'manager@simplepos.com',
        role: 'MANAGER' as const,
        createdAt: atDaysAgo(150, 9, 0),
      },
      {
        key: 'cashier' as const,
        id: USER_IDS.cashier,
        name: 'Cashier',
        email: 'cashier@simplepos.com',
        role: 'CASHIER' as const,
        createdAt: atDaysAgo(120, 9, 0),
      },
    ]

    const resolved: { admin: string; manager: string; cashier: string } = {
      admin: USER_IDS.admin,
      manager: USER_IDS.manager,
      cashier: USER_IDS.cashier,
    }

    for (const user of specs) {
      const byId = await tx.user.findUnique({ where: { id: user.id } })
      if (byId) {
        resolved[user.key] = byId.id
        continue
      }

      const byEmail = await tx.user.findUnique({ where: { email: user.email } })
      if (byEmail) {
        resolved[user.key] = byEmail.id
        continue
      }

      await tx.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: passwordHash,
          role: user.role,
          isActive: true,
          createdAt: user.createdAt,
          updatedAt: now,
        },
      })
      resolved[user.key] = user.id
    }

    return resolved
  }

  private async seedSettings(tx: TransactionClient): Promise<void> {
    const demoSettings: Record<SettingsKey, string> = {
      ...DEFAULT_SETTINGS,
      storeName: 'Demo Market POS',
      storeAddress: '100 Demo Plaza, Suite 200',
      storePhone: '+1-555-0199',
      storeEmail: 'hello@demomarket.pos',
      storeLogo: '',
      currency: 'USD',
      taxRate: String(TAX_RATE),
      taxEnabled: 'true',
      receiptFooter: 'Thank you for shopping at Demo Market!',
      receiptPaperWidth: '80',
      receiptAutoPrint: 'false',
      receiptPrinterName: '',
      receiptPrintMode: 'html',
      theme: 'light',
      lowStockThreshold: '5',
      authSessionTimeout: '480',
      authMinPasswordLength: '6',
    }

    for (const key of SETTINGS_KEYS) {
      await tx.setting.upsert({
        where: { key },
        update: {},
        create: {
          id: `demo-setting-${key}`,
          key,
          value: demoSettings[key],
        },
      })
    }
  }

  private async seedPurchaseOrders(tx: TransactionClient, now: Date): Promise<void> {
    type PoItem = { id: string; productId: string; quantity: number; cost: number; receivedQty: number }

    const orders: Array<{
      id: string
      orderNo: string
      supplierId: string
      status: 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
      note: string
      createdAt: Date
      receivedAt: Date | null
      items: PoItem[]
    }> = [
      {
        id: 'demo-po-01',
        orderNo: 'PO-DEMO-0001',
        supplierId: SUPPLIER_IDS.metro,
        status: 'RECEIVED',
        note: 'Initial beverage restock',
        createdAt: atDaysAgo(90, 11, 0),
        receivedAt: atDaysAgo(88, 15, 30),
        items: [
          { id: 'demo-poi-01a', productId: PRODUCT_IDS.cola, quantity: 48, cost: 0.7, receivedQty: 48 },
          { id: 'demo-poi-01b', productId: PRODUCT_IDS.water, quantity: 72, cost: 0.35, receivedQty: 72 },
          { id: 'demo-poi-01c', productId: PRODUCT_IDS.chips, quantity: 36, cost: 0.9, receivedQty: 36 },
        ],
      },
      {
        id: 'demo-po-02',
        orderNo: 'PO-DEMO-0002',
        supplierId: SUPPLIER_IDS.fresh,
        status: 'PARTIAL',
        note: 'Dairy and produce — partial delivery',
        createdAt: atDaysAgo(21, 10, 0),
        receivedAt: null,
        items: [
          { id: 'demo-poi-02a', productId: PRODUCT_IDS.milk, quantity: 40, cost: 1.3, receivedQty: 24 },
          { id: 'demo-poi-02b', productId: PRODUCT_IDS.yogurt, quantity: 24, cost: 1.6, receivedQty: 12 },
          { id: 'demo-poi-02c', productId: PRODUCT_IDS.apples, quantity: 30, cost: 1.7, receivedQty: 0 },
        ],
      },
      {
        id: 'demo-po-03',
        orderNo: 'PO-DEMO-0003',
        supplierId: SUPPLIER_IDS.apex,
        status: 'PENDING',
        note: 'Household restock awaiting confirmation',
        createdAt: atDaysAgo(5, 14, 0),
        receivedAt: null,
        items: [
          { id: 'demo-poi-03a', productId: PRODUCT_IDS.detergent, quantity: 20, cost: 4.2, receivedQty: 0 },
          { id: 'demo-poi-03b', productId: PRODUCT_IDS.paperTowels, quantity: 18, cost: 3.1, receivedQty: 0 },
          { id: 'demo-poi-03c', productId: PRODUCT_IDS.shampoo, quantity: 16, cost: 2.8, receivedQty: 0 },
        ],
      },
      {
        id: 'demo-po-04',
        orderNo: 'PO-DEMO-0004',
        supplierId: SUPPLIER_IDS.fresh,
        status: 'CANCELLED',
        note: 'Cancelled — supplier out of stock',
        createdAt: atDaysAgo(45, 9, 30),
        receivedAt: null,
        items: [
          { id: 'demo-poi-04a', productId: PRODUCT_IDS.butter, quantity: 20, cost: 1.9, receivedQty: 0 },
          { id: 'demo-poi-04b', productId: PRODUCT_IDS.croissant, quantity: 40, cost: 0.7, receivedQty: 0 },
        ],
      },
      {
        id: 'demo-po-05',
        orderNo: 'PO-DEMO-0005',
        supplierId: SUPPLIER_IDS.apex,
        status: 'RECEIVED',
        note: 'Personal care shipment',
        createdAt: atDaysAgo(60, 13, 0),
        receivedAt: atDaysAgo(58, 16, 0),
        items: [
          { id: 'demo-poi-05a', productId: PRODUCT_IDS.soap, quantity: 30, cost: 1.1, receivedQty: 30 },
          { id: 'demo-poi-05b', productId: PRODUCT_IDS.trashBags, quantity: 24, cost: 2.4, receivedQty: 24 },
        ],
      },
    ]

    for (const order of orders) {
      const totalCost = money(order.items.reduce((sum, item) => sum + item.quantity * item.cost, 0))
      await tx.purchaseOrder.create({
        data: {
          id: order.id,
          orderNo: order.orderNo,
          supplierId: order.supplierId,
          status: order.status,
          note: order.note,
          totalCost,
          createdAt: order.createdAt,
          updatedAt: now,
          receivedAt: order.receivedAt,
          items: {
            create: order.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              cost: item.cost,
              receivedQty: item.receivedQty,
            })),
          },
        },
      })
    }
  }

  private async seedInventoryMovements(tx: TransactionClient): Promise<void> {
    const movements: Array<{
      id: string
      productId: string
      type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
      quantity: number
      reason: string
      reference: string
      createdAt: Date
    }> = [
      { id: 'demo-mov-01', productId: PRODUCT_IDS.cola, type: 'IN', quantity: 48, reason: 'PO received', reference: 'PO-DEMO-0001', createdAt: atDaysAgo(88, 15, 35) },
      { id: 'demo-mov-02', productId: PRODUCT_IDS.water, type: 'IN', quantity: 72, reason: 'PO received', reference: 'PO-DEMO-0001', createdAt: atDaysAgo(88, 15, 36) },
      { id: 'demo-mov-03', productId: PRODUCT_IDS.chips, type: 'IN', quantity: 36, reason: 'PO received', reference: 'PO-DEMO-0001', createdAt: atDaysAgo(88, 15, 37) },
      { id: 'demo-mov-04', productId: PRODUCT_IDS.milk, type: 'IN', quantity: 24, reason: 'Partial PO receipt', reference: 'PO-DEMO-0002', createdAt: atDaysAgo(20, 11, 0) },
      { id: 'demo-mov-05', productId: PRODUCT_IDS.yogurt, type: 'IN', quantity: 12, reason: 'Partial PO receipt', reference: 'PO-DEMO-0002', createdAt: atDaysAgo(20, 11, 5) },
      { id: 'demo-mov-06', productId: PRODUCT_IDS.soap, type: 'IN', quantity: 30, reason: 'PO received', reference: 'PO-DEMO-0005', createdAt: atDaysAgo(58, 16, 5) },
      { id: 'demo-mov-07', productId: PRODUCT_IDS.trashBags, type: 'IN', quantity: 24, reason: 'PO received', reference: 'PO-DEMO-0005', createdAt: atDaysAgo(58, 16, 6) },
      { id: 'demo-mov-08', productId: PRODUCT_IDS.cola, type: 'OUT', quantity: 2, reason: 'Damaged cans removed', reference: 'ADJ-OUT-001', createdAt: atDaysAgo(70, 9, 0) },
      { id: 'demo-mov-09', productId: PRODUCT_IDS.bread, type: 'OUT', quantity: 3, reason: 'Expired bakery pull', reference: 'ADJ-OUT-002', createdAt: atDaysAgo(14, 8, 30) },
      { id: 'demo-mov-10', productId: PRODUCT_IDS.apples, type: 'OUT', quantity: 2, reason: 'Cycle count correction', reference: 'CNT-ADJ-001', createdAt: atDaysAgo(35, 17, 0) },
      { id: 'demo-mov-11', productId: PRODUCT_IDS.detergent, type: 'ADJUSTMENT', quantity: 1, reason: 'Found stock in backroom', reference: 'CNT-ADJ-002', createdAt: atDaysAgo(28, 16, 0) },
      { id: 'demo-mov-12', productId: PRODUCT_IDS.chips, type: 'RETURN', quantity: 2, reason: 'Customer return restocked', reference: 'INV-DEMO-0008', createdAt: atDaysAgo(40, 14, 20) },
      { id: 'demo-mov-13', productId: PRODUCT_IDS.shampoo, type: 'RETURN', quantity: 1, reason: 'Customer return restocked', reference: 'INV-DEMO-0015', createdAt: atDaysAgo(25, 12, 10) },
      { id: 'demo-mov-14', productId: PRODUCT_IDS.energy, type: 'OUT', quantity: 12, reason: 'Sold through — awaiting PO', reference: 'STOCK-OUT-001', createdAt: atDaysAgo(10, 18, 0) },
      { id: 'demo-mov-15', productId: PRODUCT_IDS.bananas, type: 'OUT', quantity: 4, reason: 'Spoilage write-off', reference: 'CNT-ADJ-003', createdAt: atDaysAgo(7, 8, 0) },
      { id: 'demo-mov-16', productId: PRODUCT_IDS.nuts, type: 'IN', quantity: 20, reason: 'Manual receiving', reference: 'RCV-MAN-001', createdAt: atDaysAgo(50, 10, 0) },
      { id: 'demo-mov-17', productId: PRODUCT_IDS.tomatoes, type: 'ADJUSTMENT', quantity: 3, reason: 'Receiving variance correction', reference: 'CNT-ADJ-004', createdAt: atDaysAgo(12, 15, 0) },
    ]

    await tx.inventoryMovement.createMany({ data: movements })
  }

  private async seedSales(
    tx: TransactionClient,
    userIds: { admin: string; manager: string; cashier: string },
  ): Promise<void> {
    const methods = ['CASH', 'CARD', 'MOBILE'] as const
    const cashiers = [userIds.cashier, userIds.manager, userIds.admin] as const

    type SaleDef = {
      daysAgo: number
      hour: number
      minute: number
      customerId: string | null
      lines: SaleLine[]
      discount: number
      status: 'COMPLETED' | 'PENDING' | 'REFUNDED'
      note?: string
    }

    // 42 sales across ~6 months, including today — deterministic basket patterns.
    const baskets: SaleLine[][] = [
      [{ productId: PRODUCT_IDS.cola, quantity: 2 }, { productId: PRODUCT_IDS.chips, quantity: 1 }],
      [{ productId: PRODUCT_IDS.water, quantity: 3 }, { productId: PRODUCT_IDS.apples, quantity: 1 }],
      [{ productId: PRODUCT_IDS.milk, quantity: 2 }, { productId: PRODUCT_IDS.bread, quantity: 1 }],
      [{ productId: PRODUCT_IDS.juice, quantity: 1 }, { productId: PRODUCT_IDS.cookies, quantity: 2 }],
      [{ productId: PRODUCT_IDS.detergent, quantity: 1 }, { productId: PRODUCT_IDS.soap, quantity: 2 }],
      [{ productId: PRODUCT_IDS.cheese, quantity: 1 }, { productId: PRODUCT_IDS.yogurt, quantity: 1 }],
      [{ productId: PRODUCT_IDS.nuts, quantity: 1 }, { productId: PRODUCT_IDS.water, quantity: 2 }],
      [{ productId: PRODUCT_IDS.shampoo, quantity: 1 }, { productId: PRODUCT_IDS.soap, quantity: 1 }],
      [{ productId: PRODUCT_IDS.bananas, quantity: 2 }, { productId: PRODUCT_IDS.tomatoes, quantity: 1 }],
      [{ productId: PRODUCT_IDS.muffin, quantity: 3 }, { productId: PRODUCT_IDS.cola, quantity: 1 }],
      [{ productId: PRODUCT_IDS.trashBags, quantity: 1 }, { productId: PRODUCT_IDS.paperTowels, quantity: 1 }],
      [{ productId: PRODUCT_IDS.croissant, quantity: 2 }, { productId: PRODUCT_IDS.milk, quantity: 1 }],
      [{ productId: PRODUCT_IDS.chips, quantity: 2 }, { productId: PRODUCT_IDS.cookies, quantity: 1 }],
      [{ productId: PRODUCT_IDS.apples, quantity: 2 }, { productId: PRODUCT_IDS.water, quantity: 4 }],
      [{ productId: PRODUCT_IDS.cola, quantity: 4 }, { productId: PRODUCT_IDS.nuts, quantity: 1 }],
    ]

    const dayOffsets = [
      0, 0, 1, 2, 3, 5, 7, 9, 12, 14, 18, 21, 25, 28, 32, 35, 40, 45, 50, 55, 60, 65, 70, 75, 82, 90, 95, 100, 110, 120,
      130, 140, 150, 155, 160, 165, 170, 175, 8, 16, 42, 105,
    ]

    const sales: SaleDef[] = dayOffsets.map((daysAgo, index) => {
      const lines = baskets[index % baskets.length]!
      const status: SaleDef['status'] =
        index === 3 || index === 17 ? 'REFUNDED' : index === 1 || index === 28 ? 'PENDING' : 'COMPLETED'
      return {
        daysAgo,
        hour: 9 + (index % 9),
        minute: (index * 7) % 60,
        customerId: index % 4 === 0 ? null : CUSTOMER_IDS[index % CUSTOMER_IDS.length]!,
        lines,
        discount: index % 11 === 0 ? 1 : index % 17 === 0 ? 2.5 : 0,
        status,
        note: status === 'PENDING' ? 'Awaiting payment confirmation' : status === 'REFUNDED' ? 'Full refund processed' : undefined,
      }
    })

    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i]!
      const built = buildSaleItems(sale.lines)
      const subtotal = money(built.reduce((sum, item) => sum + item.total, 0))
      const totals = saleTotals(subtotal, sale.discount)
      const invoiceNo = `INV-DEMO-${String(i + 1).padStart(4, '0')}`
      const saleId = `demo-sale-${String(i + 1).padStart(4, '0')}`
      const createdAt = atDaysAgo(sale.daysAgo, sale.hour, sale.minute)

      await tx.sale.create({
        data: {
          id: saleId,
          invoiceNo,
          customerId: sale.customerId,
          userId: cashiers[i % cashiers.length],
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          method: methods[i % methods.length],
          status: sale.status,
          note: sale.note,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: built.map((item, itemIndex) => ({
              id: `demo-saleitem-${String(i + 1).padStart(4, '0')}-${itemIndex + 1}`,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
        },
      })
    }
  }
}

export async function seedDemoDataIfEmpty(): Promise<boolean> {
  return new DemoDataService().seedIfEmpty()
}

/** Ensures the three SimplePOS login accounts exist with the expected password (any DB). */
export async function ensureSimplePosUsers(): Promise<void> {
  const db = getPrisma()
  const password = hashPassword('Test@123')
  const specs = [
    { id: USER_IDS.admin, name: 'Admin', email: 'admin@simplepos.com', role: 'ADMIN' as const },
    { id: USER_IDS.manager, name: 'Manager', email: 'manager@simplepos.com', role: 'MANAGER' as const },
    { id: USER_IDS.cashier, name: 'Cashier', email: 'cashier@simplepos.com', role: 'CASHIER' as const },
  ]

  for (const user of specs) {
    const byEmail = await db.user.findUnique({ where: { email: user.email } })
    if (byEmail) {
      await db.user.update({
        where: { id: byEmail.id },
        data: {
          name: user.name,
          role: user.role,
          password,
          isActive: true,
        },
      })
      continue
    }

    const byId = await db.user.findUnique({ where: { id: user.id } })
    if (byId) {
      await db.user.update({
        where: { id: byId.id },
        data: {
          name: user.name,
          email: user.email,
          role: user.role,
          password,
          isActive: true,
        },
      })
      continue
    }

    await db.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password,
        role: user.role,
        isActive: true,
      },
    })
  }
}

