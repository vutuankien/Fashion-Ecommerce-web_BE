import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '@/prisma/prisma.service';
/** Import CategoriesCache */
import { CategoriesCache } from './categories.cache';
/** Import RedisModule */
import { RedisModule } from '@/config/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, CategoriesCache],
})
export class CategoriesModule {}
