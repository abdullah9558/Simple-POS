import { getPrisma } from '../prisma.ts'

export const DEFAULT_BUSINESS_ID = 'biz-default'
export const DEFAULT_STORE_ID = 'store-default'

/**
 * Ensures a default Business + Store exist and backfills legacy rows
 * so existing installations keep working after the multi-store migration.
 */
export class TenantBootstrapService {
  private get db() {
    return getPrisma()
  }

  async ensureDefaultTenant(): Promise<{ businessId: string; storeId: string }> {
    const storeNameSetting = await this.db.setting.findUnique({ where: { key: 'storeName' } })
    const businessName = storeNameSetting?.value?.trim() || 'My Business'

    let business = await this.db.business.findUnique({ where: { id: DEFAULT_BUSINESS_ID } })
    if (!business) {
      business = await this.db.business.findFirst({ where: { code: 'DEFAULT' } })
    }
    if (!business) {
      business = await this.db.business.create({
        data: {
          id: DEFAULT_BUSINESS_ID,
          name: businessName,
          code: 'DEFAULT',
          isActive: true,
        },
      })
    }

    let store = await this.db.store.findUnique({ where: { id: DEFAULT_STORE_ID } })
    if (!store) {
      store = await this.db.store.findFirst({
        where: { businessId: business.id, code: 'MAIN' },
      })
    }
    if (!store) {
      const address = (await this.db.setting.findUnique({ where: { key: 'storeAddress' } }))?.value
      const phone = (await this.db.setting.findUnique({ where: { key: 'storePhone' } }))?.value
      const email = (await this.db.setting.findUnique({ where: { key: 'storeEmail' } }))?.value
      store = await this.db.store.create({
        data: {
          id: DEFAULT_STORE_ID,
          businessId: business.id,
          name: businessName,
          code: 'MAIN',
          address: address || null,
          phone: phone || null,
          email: email || null,
          isActive: true,
        },
      })
    }

    const businessId = business.id
    const storeId = store.id

    await this.db.$executeRawUnsafe(`UPDATE "User" SET "businessId" = ? WHERE "businessId" IS NULL`, businessId)
    await this.db.$executeRawUnsafe(`UPDATE "Category" SET "businessId" = ? WHERE "businessId" IS NULL`, businessId)
    await this.db.$executeRawUnsafe(`UPDATE "Product" SET "businessId" = ? WHERE "businessId" IS NULL`, businessId)
    await this.db.$executeRawUnsafe(`UPDATE "Supplier" SET "businessId" = ? WHERE "businessId" IS NULL`, businessId)
    await this.db.$executeRawUnsafe(`UPDATE "Customer" SET "businessId" = ? WHERE "businessId" IS NULL`, businessId)
    await this.db.$executeRawUnsafe(`UPDATE "Sale" SET "storeId" = ? WHERE "storeId" IS NULL`, storeId)
    await this.db.$executeRawUnsafe(`UPDATE "InventoryMovement" SET "storeId" = ? WHERE "storeId" IS NULL`, storeId)
    await this.db.$executeRawUnsafe(`UPDATE "PurchaseOrder" SET "storeId" = ? WHERE "storeId" IS NULL`, storeId)
    await this.db.$executeRawUnsafe(`UPDATE "Setting" SET "storeId" = ? WHERE "storeId" IS NULL`, storeId)

    // Seed StoreInventory from Product.stock mirror for the default store.
    const products = await this.db.product.findMany({
      select: { id: true, stock: true, minStock: true },
    })
    for (const product of products) {
      const existing = await this.db.storeInventory.findUnique({
        where: { storeId_productId: { storeId, productId: product.id } },
      })
      if (!existing) {
        await this.db.storeInventory.create({
          data: {
            storeId,
            productId: product.id,
            quantity: product.stock,
            minStock: product.minStock,
            version: 1,
          },
        })
      }
    }

    // Ensure all users are members of the default store.
    const users = await this.db.user.findMany({ select: { id: true, role: true } })
    for (const user of users) {
      const membership = await this.db.userStore.findUnique({
        where: { userId_storeId: { userId: user.id, storeId } },
      })
      if (!membership) {
        await this.db.userStore.create({
          data: {
            userId: user.id,
            storeId,
            role: user.role,
          },
        })
      }
    }

    // Second demo store for multi-store switcher (idempotent).
    let downtown = await this.db.store.findFirst({
      where: { businessId, code: 'DTN' },
    })
    if (!downtown) {
      downtown = await this.db.store.create({
        data: {
          id: 'store-downtown',
          businessId,
          name: 'Downtown Branch',
          code: 'DTN',
          address: '200 Center Ave',
          isActive: true,
        },
      })
      const catalog = await this.db.product.findMany({
        select: { id: true, minStock: true, stock: true },
        take: 12,
      })
      for (const product of catalog) {
        await this.db.storeInventory.create({
          data: {
            storeId: downtown.id,
            productId: product.id,
            quantity: Math.max(0, Math.floor(product.stock / 2)),
            minStock: product.minStock,
            version: 1,
          },
        })
      }
      for (const user of users) {
        await this.db.userStore.upsert({
          where: { userId_storeId: { userId: user.id, storeId: downtown.id } },
          create: { userId: user.id, storeId: downtown.id, role: user.role },
          update: {},
        })
      }
    }

    return { businessId, storeId }
  }
}

export async function ensureDefaultTenant(): Promise<{ businessId: string; storeId: string }> {
  return new TenantBootstrapService().ensureDefaultTenant()
}
