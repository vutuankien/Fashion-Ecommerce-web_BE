-- CreateTable
CREATE TABLE "FollowShop" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "shopId" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowShop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FollowShop_userId_idx" ON "FollowShop"("userId");

-- CreateIndex
CREATE INDEX "FollowShop_shopId_idx" ON "FollowShop"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowShop_userId_shopId_key" ON "FollowShop"("userId", "shopId");

-- AddForeignKey
ALTER TABLE "FollowShop" ADD CONSTRAINT "FollowShop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowShop" ADD CONSTRAINT "FollowShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
