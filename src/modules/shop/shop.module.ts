import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { AuthModule } from '../auth/auth.module';
/** Import ShopCache */
import { ShopCache } from './shop.cache';
/** Import RedisModule */
import { RedisModule } from '@/config/redis.module';

@Module({
  imports:[AuthModule, RedisModule],
  controllers: [ShopController],
  providers: [ShopService,PrismaService,CloudinaryService, ShopCache],
  exports: [ShopCache],
})
export class ShopModule {}
