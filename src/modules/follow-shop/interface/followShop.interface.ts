import type { Pagination } from "@shared/types/api";
import type { FollowShopCreateResponse, FollowShopDeleteResponse, FollowShopListResponse, IFollowShopItem, IShopFollowerItem, ShopFollowerListResponse } from "@shared/types/followShop";

export interface PaginatedResult<T> {
    data: T[];
    total: number;
}

export abstract class AbstractFollowShop {
    /** Follow a shop */
    abstract follow(userId: number, shopId: string): Promise<FollowShopCreateResponse>;

    /** Unfollow a shop */
    abstract unfollow(userId: number, shopId: string): Promise<FollowShopDeleteResponse>;

    /** Check if user is following a shop */
    abstract isFollowing(userId: number, shopId: string): Promise<boolean>;

    /** Get list of shops that user is following */
    abstract getUserFollowing(
        userId: number,
        params?: { page?: number; limit?: number }
    ): Promise<FollowShopListResponse>;

    /** Get list of users that are following a shop */
    abstract getShopFollowers(
        shopId: string,
        params?: { page?: number; limit?: number }
    ): Promise<ShopFollowerListResponse>;

}

export type { IFollowShopItem, IShopFollowerItem };
