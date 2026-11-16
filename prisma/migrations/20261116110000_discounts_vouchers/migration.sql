-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('ALL', 'CATEGORIES', 'PRODUCTS');

-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('STANDARD', 'WELCOME');

-- CreateEnum
CREATE TYPE "VoucherReason" AS ENUM ('PURCHASE', 'GIFT', 'REFUND', 'PROMO');

-- CreateEnum
CREATE TYPE "VoucherTransactionReason" AS ENUM ('ISSUE', 'REDEEM', 'REFUND', 'ADJUST');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "phoneNormalized" TEXT,
ADD COLUMN     "voucherAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voucherCode" TEXT;

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "percentOff" INTEGER,
    "valuePKR" INTEGER,
    "valueUSD" INTEGER,
    "minSubtotalPKR" INTEGER,
    "minSubtotalUSD" INTEGER,
    "maxDiscountPKR" INTEGER,
    "maxDiscountUSD" INTEGER,
    "appliesTo" "DiscountScope" NOT NULL DEFAULT 'ALL',
    "categoryIds" TEXT[],
    "productIds" TEXT[],
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "combinable" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "kind" "DiscountKind" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRedemption" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "initialBalance" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "recipientEmail" TEXT,
    "note" TEXT,
    "issuedReason" "VoucherReason" NOT NULL DEFAULT 'GIFT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherTransaction" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "orderId" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" "VoucherTransactionReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_kind_active_idx" ON "Discount"("kind", "active");

-- CreateIndex
CREATE INDEX "DiscountRedemption_discountId_customerEmail_idx" ON "DiscountRedemption"("discountId", "customerEmail");

-- CreateIndex
CREATE INDEX "DiscountRedemption_discountId_customerPhone_idx" ON "DiscountRedemption"("discountId", "customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountRedemption_discountId_orderId_key" ON "DiscountRedemption"("discountId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftVoucher_code_key" ON "GiftVoucher"("code");

-- CreateIndex
CREATE INDEX "VoucherTransaction_voucherId_createdAt_idx" ON "VoucherTransaction"("voucherId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- CreateIndex
CREATE INDEX "Order_phoneNormalized_idx" ON "Order"("phoneNormalized");

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTransaction" ADD CONSTRAINT "VoucherTransaction_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "GiftVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTransaction" ADD CONSTRAINT "VoucherTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: last 10 digits of each existing order's phone (matches normalizePhone).
UPDATE "Order" SET "phoneNormalized" = right(regexp_replace("phone", '\D', '', 'g'), 10) WHERE "phoneNormalized" IS NULL;
