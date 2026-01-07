/*
  Warnings:

  - Added the required column `shop_id` to the `Employer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employer" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
