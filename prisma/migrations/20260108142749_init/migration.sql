/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `shop` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "email" SET DEFAULT 'employer@gmail.com',
ALTER COLUMN "password" SET DEFAULT 'employer';

-- AlterTable
ALTER TABLE "shop" ADD COLUMN     "email" TEXT NOT NULL DEFAULT 'shop@gmail.com',
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'shop',
ADD COLUMN     "refresh_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shop_email_key" ON "shop"("email");
