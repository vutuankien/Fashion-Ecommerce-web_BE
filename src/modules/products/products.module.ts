import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsRepo } from './products.repo';
import { ProductsCache } from './products.cache';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService,ProductsRepo,ProductsCache],
})
export class ProductsModule {}
