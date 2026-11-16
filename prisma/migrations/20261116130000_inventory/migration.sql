-- CreateEnum
CREATE TYPE "InventoryReason" AS ENUM ('ORDER', 'CANCEL', 'RESTOCK', 'ADJUSTMENT', 'RETURN');

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reason" "InventoryReason" NOT NULL,
    "orderId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryMovement_variantId_createdAt_idx" ON "InventoryMovement"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
