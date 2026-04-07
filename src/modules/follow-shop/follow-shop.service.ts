import { BadRequestException, Injectable } from '@nestjs/common';
import { AbstractFollowShop, IFollowShopItem, IShopFollowerItem, PaginatedResult } from './interface/followShop.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { FollowShopCreateResponse, FollowShopDeleteResponse, FollowShopListResponse, ShopFollowerListResponse } from '@shared/types/followShop';
import { ShopCache } from '../shop/shop.cache';

@Injectable()
export class FollowShopService implements AbstractFollowShop {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopCache: ShopCache
  ) {}
 
  async follow(userId: number, shopId: string): Promise<FollowShopCreateResponse> {
    try {
      const follow = await this.prisma.$transaction(async (tx) => {

        // 1. tạo follow
        const createdFollow = await tx.followShop.create({
          data: {
            userId,
            shopId,
          },
          select: {
            id: true,
            createdAt: true,
            shop: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
                slug: true,
              },
            },
          },
        });

        // 2. tăng follower count
        const result = await tx.shop.update({
          where: { id: shopId },
          data: {
            followersCount: {
              increment: 1,
            },
          },
        });

        return {createdFollow, result};
      });

      // 3. Xóa cache của shop để cập nhật follower count
      await this.shopCache.delete(shopId);
      await this.shopCache.invalidateAll();

      return {
        success: true,
        message: 'Follow shop successfully',
        data: {
          id: follow.createdFollow.id,
          shop: {
            id: follow.createdFollow.shop.id,
            name: follow.createdFollow.shop.name,
            avatar_url: follow.createdFollow.shop.avatar_url ?? "",
            slug: follow.createdFollow.shop.slug,
            followersCount: follow.result.followersCount,
          },
          createdAt: follow.createdFollow.createdAt.toISOString(),
        },
      };

    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Already followed');
      }
      throw error;
    }
  }
  
  async unfollow(userId: number, shopId: string): Promise<FollowShopDeleteResponse> {
    try{
      const follow = await this.prisma.$transaction(async (tx) => {

        // 1. xóa follow
        const unfollowed = await tx.followShop.deleteMany({
          where: {
            userId,
            shopId,
          },
        });

        /** check xem có follow không */
        if(unfollowed.count === 0){
          throw new BadRequestException('Not followed');
        }

        // 2. giảm follower count
        await tx.shop.update({
          where: { id: shopId },
          data: {
            followersCount: {
              decrement: 1,
            },
          },
        });
      });

      // 3. Xóa cache của shop để cập nhật follower count
      await this.shopCache.delete(shopId);
      await this.shopCache.invalidateAll();

      return {
        success: true,
        message: 'Unfollow shop successfully',
      }

    }catch (e) {
      throw e
    }
  }
  
  async isFollowing(userId: number, shopId: string): Promise<boolean> {
    try {
      const follow = await this.prisma.followShop.findUnique({
        where: {
          userId_shopId: {
            userId,
            shopId,
          },
        },
      });
      return !!follow;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 
   * @param userId 
   * @param params 
   * @returns 
   * trả về danh sách các shop mà user đã follow
   */
  async getUserFollowing(userId: number, params?: { page?: number; limit?: number }): Promise<FollowShopListResponse> {
    try {
      /**
       * thực hiện phân trang
       */
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      const skip = (page - 1) * limit;

      /**
       * lấy danh sách các shop mà user đã follow
       */
      const follows = await this.prisma.followShop.findMany({
        /**
         * điều kiện
         */
        where: {
          userId,
        },
        /**
         * phân trang
         */
        skip,
        take: limit,
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              slug: true,
              followersCount: true,
            },
          },
        },
      });

      /**
       * lấy tổng số follow
       */
      const total = await this.prisma.followShop.count({
        where: {
          userId,
        },
      });

      return {
        success: true,
        message: 'Get user following successfully',
        data: follows.map((follow) => ({
          id: follow.id,
          shop: {
            id: follow.shop.id,
            name: follow.shop.name,
            avatar_url: follow.shop.avatar_url ?? '',
            slug: follow.shop.slug,
            followersCount: follow.shop.followersCount,
          },
          createdAt: follow.createdAt.toISOString(),
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }
  


  /**
   * 
   * @param shopId 
   * @param params 
   * @returns 
   * trả về danh sách các user đã follow shop
   */
  async getShopFollowers(
    shopId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ShopFollowerListResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.followShop.findMany({
        where: { shopId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      }),
      this.prisma.followShop.count({
        where: { shopId },
      }),
    ]);

    return {
      success: true,
      message: 'Get shop followers successfully',
      data: follows.map((follow) => ({
        id: follow.id,
        user: {
          id: follow.user.id,
          name: follow.user.name,
          avatarUrl: follow.user.avatar_url,
        },
        createdAt: follow.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  /** */
}
