/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `shop` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `shop` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "shop" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shop_slug_key" ON "shop"("slug");
