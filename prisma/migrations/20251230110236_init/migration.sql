-- CreateTable
CREATE TABLE "shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "typeProvider" TEXT NOT NULL,
    "desc" TEXT,
    "avatar_url" TEXT NOT NULL,
    "bank" TEXT,
    "bank_account" TEXT,
    "bank_number" TEXT,
    "address" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_productsToshop" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_productsToshop_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_productsToshop_B_index" ON "_productsToshop"("B");

-- AddForeignKey
ALTER TABLE "shop" ADD CONSTRAINT "shop_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop" ADD CONSTRAINT "shop_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop" ADD CONSTRAINT "shop_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_productsToshop" ADD CONSTRAINT "_productsToshop_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_productsToshop" ADD CONSTRAINT "_productsToshop_B_fkey" FOREIGN KEY ("B") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
