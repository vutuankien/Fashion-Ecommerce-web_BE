/*
  Warnings:

  - Added the required column `country_code` to the `provinces` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_type` to the `provinces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "provinces" ADD COLUMN     "country_code" INTEGER NOT NULL,
ADD COLUMN     "region_type" TEXT NOT NULL;
