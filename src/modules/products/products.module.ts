import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsRepo } from './products.repo';
import { ProductsCache } from './products.cache';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductSearchModule } from '../product-search/product-search.module';

@Module({
  imports: [AuthModule, ProductSearchModule],
  controllers: [ProductsController],
  providers: [ProductsService,ProductsRepo,ProductsCache, PrismaService],
})
export class ProductsModule {}
