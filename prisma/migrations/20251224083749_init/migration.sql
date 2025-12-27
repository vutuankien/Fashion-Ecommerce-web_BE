/*
  Warnings:

  - Added the required column `new_id` to the `communes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "communes" ADD COLUMN     "new_id" TEXT NOT NULL;
