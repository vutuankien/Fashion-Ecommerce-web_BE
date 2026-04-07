/*
  Warnings:

  - You are about to drop the column `followersCount` on the `FollowShop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FollowShop" DROP COLUMN "followersCount";

-- AlterTable
ALTER TABLE "shop" ADD COLUMN     "followersCount" INTEGER NOT NULL DEFAULT 0;
