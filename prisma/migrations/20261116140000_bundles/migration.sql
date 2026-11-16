-- CreateEnum
CREATE TYPE "BundlePricingMode" AS ENUM ('FIXED', 'PERCENT_OFF');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "bundleDiscountPercent" INTEGER,
ADD COLUMN     "bundlePricingMode" "BundlePricingMode" NOT NULL DEFAULT 'FIXED';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "bundleComponents" JSONB;

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleProductId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BundleItem_variantId_idx" ON "BundleItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleItem_bundleProductId_variantId_key" ON "BundleItem"("bundleProductId", "variantId");

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleProductId_fkey" FOREIGN KEY ("bundleProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
