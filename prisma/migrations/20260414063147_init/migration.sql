/*
  Warnings:

  - Changed the type of `userId` on the `VoucherUsage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "VoucherUsage" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "VoucherUsage_userId_voucherId_key" ON "VoucherUsage"("userId", "voucherId");
