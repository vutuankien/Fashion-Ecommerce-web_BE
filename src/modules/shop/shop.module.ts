import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthModule } from '../auth/auth.module';
/** Import ShopCache */
import { ShopCache } from './shop.cache';
/** Import RedisModule */
import { RedisModule } from 'src/config/redis.module';

@Module({
  imports:[AuthModule, RedisModule],
  controllers: [ShopController],
  providers: [ShopService,PrismaService,CloudinaryService, ShopCache],
})
export class ShopModule {}
