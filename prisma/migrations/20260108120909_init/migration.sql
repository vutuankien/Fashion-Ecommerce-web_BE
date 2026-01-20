/*
  Warnings:

  - A unique constraint covering the columns `[shopId,warehouseId,productId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Inventory_shopId_warehouseId_productId_key" ON "Inventory"("shopId", "warehouseId", "productId");
