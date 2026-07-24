-- Multi-tenant / multi-store extension (additive + backfill-safe)

-- New tables
CREATE TABLE IF NOT EXISTS "Business" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Business_code_key" ON "Business"("code");

CREATE TABLE IF NOT EXISTS "Store" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Store_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Store_businessId_code_key" ON "Store"("businessId", "code");
CREATE INDEX IF NOT EXISTS "Store_businessId_idx" ON "Store"("businessId");

CREATE TABLE IF NOT EXISTS "UserStore" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'CASHIER',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserStore_userId_storeId_key" ON "UserStore"("userId", "storeId");
CREATE INDEX IF NOT EXISTS "UserStore_storeId_idx" ON "UserStore"("storeId");
CREATE INDEX IF NOT EXISTS "UserStore_userId_idx" ON "UserStore"("userId");

CREATE TABLE IF NOT EXISTS "StoreInventory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "minStock" INTEGER NOT NULL DEFAULT 5,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreInventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoreInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StoreInventory_storeId_productId_key" ON "StoreInventory"("storeId", "productId");
CREATE INDEX IF NOT EXISTS "StoreInventory_storeId_idx" ON "StoreInventory"("storeId");
CREATE INDEX IF NOT EXISTS "StoreInventory_productId_idx" ON "StoreInventory"("productId");

CREATE TABLE IF NOT EXISTS "StockTransfer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transferNo" TEXT NOT NULL,
  "fromStoreId" TEXT NOT NULL,
  "toStoreId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  CONSTRAINT "StockTransfer_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockTransfer_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StockTransfer_transferNo_key" ON "StockTransfer"("transferNo");
CREATE INDEX IF NOT EXISTS "StockTransfer_fromStoreId_idx" ON "StockTransfer"("fromStoreId");
CREATE INDEX IF NOT EXISTS "StockTransfer_toStoreId_idx" ON "StockTransfer"("toStoreId");

CREATE TABLE IF NOT EXISTS "TransferItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transferId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SyncQueue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "clientMutationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "syncedAt" DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS "SyncQueue_clientMutationId_key" ON "SyncQueue"("clientMutationId");
CREATE INDEX IF NOT EXISTS "SyncQueue_status_createdAt_idx" ON "SyncQueue"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "SyncQueue_entityType_entityId_idx" ON "SyncQueue"("entityType", "entityId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT,
  "storeId" TEXT,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_storeId_createdAt_idx" ON "AuditLog"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- Additive columns (ignorable if already present via runner)
ALTER TABLE "User" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Category" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Product" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Product" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Supplier" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Customer" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Sale" ADD COLUMN "storeId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "InventoryMovement" ADD COLUMN "storeId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "storeId" TEXT;
ALTER TABLE "Setting" ADD COLUMN "storeId" TEXT;

CREATE INDEX IF NOT EXISTS "User_businessId_idx" ON "User"("businessId");
CREATE INDEX IF NOT EXISTS "Category_businessId_idx" ON "Category"("businessId");
CREATE INDEX IF NOT EXISTS "Product_businessId_idx" ON "Product"("businessId");
CREATE INDEX IF NOT EXISTS "Product_barcode_idx" ON "Product"("barcode");
CREATE INDEX IF NOT EXISTS "Supplier_businessId_idx" ON "Supplier"("businessId");
CREATE INDEX IF NOT EXISTS "Customer_businessId_idx" ON "Customer"("businessId");
CREATE INDEX IF NOT EXISTS "Sale_storeId_createdAt_idx" ON "Sale"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_storeId_createdAt_idx" ON "InventoryMovement"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_storeId_idx" ON "PurchaseOrder"("storeId");
CREATE INDEX IF NOT EXISTS "Setting_storeId_idx" ON "Setting"("storeId");
