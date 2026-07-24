import fs from 'fs'
import { disconnectPrisma, getPrisma, getDatabaseFilePath } from './prisma.ts'

export interface DatabaseInfo {
  path: string
  sizeBytes: number
  sizeFormatted: string
  tableCounts: Record<string, number>
  lastModified: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export class DatabaseService {
  getDbPath(): string {
    return getDatabaseFilePath()
  }

  async getInfo(): Promise<DatabaseInfo> {
    const dbPath = this.getDbPath()
    const stat = fs.statSync(dbPath)
    const db = getPrisma()

    const [products, sales, customers, users, categories, suppliers, movements] = await Promise.all([
      db.product.count(),
      db.sale.count(),
      db.customer.count(),
      db.user.count(),
      db.category.count(),
      db.supplier.count(),
      db.inventoryMovement.count(),
    ])

    return {
      path: dbPath,
      sizeBytes: stat.size,
      sizeFormatted: formatBytes(stat.size),
      lastModified: stat.mtime.toISOString(),
      tableCounts: {
        products,
        sales,
        customers,
        users,
        categories,
        suppliers,
        movements,
      },
    }
  }

  async backup(destPath: string): Promise<string> {
    const src = this.getDbPath()
    if (!fs.existsSync(src)) throw new Error('Database file not found')
    fs.copyFileSync(src, destPath)
    return destPath
  }

  async restore(srcPath: string): Promise<void> {
    if (!fs.existsSync(srcPath)) throw new Error('Backup file not found')
    await disconnectPrisma()
    fs.copyFileSync(srcPath, this.getDbPath())
  }
}
