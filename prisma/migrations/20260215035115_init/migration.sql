-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" TEXT[],
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Employer_id_shop_id_idx" ON "Employer"("id", "shop_id");

-- CreateIndex
CREATE INDEX "Employer_userId_idx" ON "Employer"("userId");

-- CreateIndex
CREATE INDEX "Inventory_id_productId_warehouseId_shopId_idx" ON "Inventory"("id", "productId", "warehouseId", "shopId");

-- CreateIndex
CREATE INDEX "products_id_shop_id_warehouse_id_idx" ON "products"("id", "shop_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "shop_id_userId_idx" ON "shop"("id", "userId");
