import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FollowShopService } from './follow-shop.service';
import { CreateFollowShopDto } from './dto/create-follow-shop.dto';
import { UpdateFollowShopDto } from './dto/update-follow-shop.dto';
import { FollowShopCreateResponse } from '@shared/types/followShop';

@Controller('follow-shop')
export class FollowShopController {
  constructor(private readonly followShopService: FollowShopService) {}

  /**
   * 
   * @param shopId 
   * @param userId 
   * @returns 
   * tạo mới follow shop
   */
  @Post('/:shopId/:userId')
  async follow(@Param('shopId') shopId: string, @Param('userId') userId: number) {
    return await this.followShopService.follow(userId, shopId) 
  }

  /**
   * 
   * @param shopId 
   * @param userId 
   * @returns 
   * xóa follow shop
   */
  @Delete('/:shopId/:userId')
  async unfollow(@Param('shopId') shopId: string, @Param('userId') userId: number) {
    return await this.followShopService.unfollow(userId, shopId);
  }

  /**
   * 
   * @param userId 
   * @param params 
   * @returns 
   * lấy danh sách các shop mà user đã follow
   */
  @Get('/user/:userId')
  async getUserFollowing(@Param('userId') userId: number, @Body() params?: { page?: number; limit?: number }) {
    return this.followShopService.getUserFollowing(userId, params);
  }

  /**
   * 
   * @param shopId 
   * @param params 
   * @returns 
   * lấy danh sách các user đã follow shop
   */
  @Get('/shop/:shopId')
  async getShopFollowers(@Param('shopId') shopId: string, @Body() params?: { page?: number; limit?: number }) {
    return this.followShopService.getShopFollowers(shopId, params);
  }

  /**
   * 
   * @param shopId 
   * @param userId 
   * @returns 
   * kiểm tra xem user có follow shop không
   */
  @Get('/:shopId/:userId')
  async isFollowing(@Param('shopId') shopId: string, @Param('userId') userId: number) {
    return this.followShopService.isFollowing(userId, shopId);
  }


}
