-- CreateEnum
CREATE TYPE "VoucherProvider" AS ENUM ('SHOP', 'ADMIN');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('FREESHIPPING', 'DISCOUNT_MONEY', 'DISCOUNT_PERCENT');

-- CreateEnum
CREATE TYPE "VoucherApplyType" AS ENUM ('ALL', 'PRODUCT', 'CATEGORY');

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "provider" "VoucherProvider" NOT NULL DEFAULT 'ADMIN',
    "shopId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VoucherType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxValue" INTEGER,
    "minOrderValue" INTEGER,
    "applyType" "VoucherApplyType" NOT NULL DEFAULT 'ALL',
    "quantity" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "usageLimitPerUser" INTEGER,
    "shippingDiscount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherProduct" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "VoucherProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherCategory" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "VoucherCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVoucher" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "discountAmount" INTEGER NOT NULL,

    CONSTRAINT "OrderVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_code_idx" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_shopId_idx" ON "Voucher"("shopId");

-- CreateIndex
CREATE INDEX "Voucher_startTime_endTime_idx" ON "Voucher"("startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherProduct_voucherId_productId_key" ON "VoucherProduct"("voucherId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherCategory_voucherId_categoryId_key" ON "VoucherCategory"("voucherId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherUsage_userId_voucherId_key" ON "VoucherUsage"("userId", "voucherId");

-- CreateIndex
CREATE INDEX "OrderVoucher_orderId_idx" ON "OrderVoucher"("orderId");

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherProduct" ADD CONSTRAINT "VoucherProduct_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherCategory" ADD CONSTRAINT "VoucherCategory_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVoucher" ADD CONSTRAINT "OrderVoucher_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
