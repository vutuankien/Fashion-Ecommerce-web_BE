/*
  Warnings:

  - You are about to drop the `_productsToshop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_productsToshop" DROP CONSTRAINT "_productsToshop_A_fkey";

-- DropForeignKey
ALTER TABLE "_productsToshop" DROP CONSTRAINT "_productsToshop_B_fkey";

-- DropTable
DROP TABLE "_productsToshop";

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
