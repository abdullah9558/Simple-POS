-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "creditBalance" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "outstandingBalance" REAL NOT NULL DEFAULT 0;
