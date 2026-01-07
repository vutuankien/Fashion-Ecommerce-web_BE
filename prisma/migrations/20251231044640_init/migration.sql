-- CreateEnum
CREATE TYPE "Level" AS ENUM ('normal', 'priority', 'vip');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'employer';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" "Level" DEFAULT 'normal',
ADD COLUMN     "spend" INTEGER;
