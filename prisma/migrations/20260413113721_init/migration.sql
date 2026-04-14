-- AddForeignKey
ALTER TABLE "VoucherCategory" ADD CONSTRAINT "VoucherCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
