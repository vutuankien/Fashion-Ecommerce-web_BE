import { Module } from '@nestjs/common';
import { FollowShopService } from './follow-shop.service';
import { FollowShopController } from './follow-shop.controller';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [ShopModule],
  controllers: [FollowShopController],
  providers: [FollowShopService],
})
export class FollowShopModule {}
