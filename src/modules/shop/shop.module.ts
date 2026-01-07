import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [ShopController],
  providers: [ShopService,PrismaService,CloudinaryService],
})
export class ShopModule {}
