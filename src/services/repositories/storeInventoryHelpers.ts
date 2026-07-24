import type { TransactionClient } from '../prisma.ts'
import { storeContext } from '../tenant/StoreContext.ts'
import { getPrisma } from '../prisma.ts'

export function resolveStoreId(explicit?: string | null): string {
  return explicit || storeContext.getActiveStoreId()
}

/**
 * Adjust store-scoped inventory and sync Product.stock mirror for that store.
 * delta > 0 increases stock; delta < 0 decreases.
 */
export async function adjustStoreInventoryQty(
  tx: TransactionClient,
  storeId: string,
  productId: string,
  delta: number,
  opts?: { allowCreate?: boolean; minStock?: number },
): Promise<number> {
  const existing = await tx.storeInventory.findUnique({
    where: { storeId_productId: { storeId, productId } },
  })

  let nextQty: number
  if (!existing) {
    if (delta < 0 && !opts?.allowCreate) {
      throw new Error('Insufficient store inventory')
    }
    nextQty = Math.max(0, delta)
    if (delta < 0) throw new Error('Insufficient store inventory')
    await tx.storeInventory.create({
      data: {
        storeId,
        productId,
        quantity: nextQty,
        minStock: opts?.minStock ?? 5,
        version: 1,
      },
    })
  } else {
    nextQty = existing.quantity + delta
    if (nextQty < 0) throw new Error('Insufficient store inventory')
    await tx.storeInventory.update({
      where: { id: existing.id },
      data: {
        quantity: nextQty,
        version: { increment: 1 },
      },
    })
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: nextQty },
  })

  return nextQty
}

/** Refresh Product.stock mirrors from a store's StoreInventory (on store switch). */
export async function refreshProductStockMirrors(storeId: string): Promise<void> {
  const db = getPrisma()
  const rows = await db.storeInventory.findMany({ where: { storeId } })
  const qtyByProduct = new Map(rows.map((r) => [r.productId, r.quantity]))
  const products = await db.product.findMany({ select: { id: true } })
  for (const product of products) {
    const qty = qtyByProduct.get(product.id) ?? 0
    await db.product.update({
      where: { id: product.id },
      data: { stock: qty },
    })
  }
}
