/** Import Injectable decorator từ NestJS */
import { Injectable } from '@nestjs/common';
/** Import Redis connection handler */
import { RedisConnection } from '@/config/redis.config';
/** Import Prisma service để truy vấn DB khi cache miss */
import { PrismaService } from '@/prisma/prisma.service';
/** Import interface định nghĩa các phương thức cache */
import { IWishlistCache, IWishlistWithProduct } from './interfaces/wishlist.interface';

/**
 * Cache Layer cho Wishlist
 * 
 * Xử lý lưu trữ và quản lý cache wishlist trên Redis
 * Áp dụng mô hình Cache-Aside:
 * - GET: Check cache → cache miss → query DB → set cache
 * - ADD/REMOVE/CLEAR: Update DB → invalidate cache
 * 
 * TTL: 300 giây (5 phút)
 */
@Injectable()
export class WishlistCache implements IWishlistCache {
  /** Thời gian sống mặc định của cache: 300 giây (5 phút) */
  private readonly TTL = 300;
  
  /** Tiền tố cho các khóa wishlist trong Redis */
  /** Format: FashionWeb:Wishlist:Scope:Params */
  private readonly PREFIX = 'FashionWeb:Wishlist:';

  /**
   * Hàm khởi tạo các dependency
   * 
   * @param redisConnection - Kết nối Redis
   * @param prisma - PrismaService để truy vấn DB khi cache miss
   */
  constructor(
    /** Kết nối Redis để lưu trữ cache */
    private readonly redisConnection: RedisConnection = new RedisConnection(),
    /** Prisma để query DB khi cache miss */
    private readonly prisma: PrismaService = new PrismaService()
  ) {}

  /**
   * Lấy danh sách wishlist của user từ cache
   * 
   * Nếu tồn tại trong cache → trả về ngay
   * Nếu không có trong cache (cache miss):
   * - Query DB để lấy wishlist đầy đủ
   * - Lưu vào cache
   * - Trả về
   * 
   * @param userId - ID của user
   * @returns Mảng wishlist items với thông tin sản phẩm
   * 
   * @example
   * const wishlist = await cache.getWishlist(123);
   * // Nếu có cache, trả về từ Redis
   * // Nếu không, query DB, lưu cache rồi trả về
   */
  async getWishlist(userId: number): Promise<IWishlistWithProduct[]> {
    try {
      /** Lấy kết nối Redis */
      const { REDIS_CLIENT } = await this.redisConnection.exec({});
      
      /** Tạo khóa cache: FashionWeb:Wishlist:list:{userId} */
      const CACHE_KEY = `${this.PREFIX}list:${userId}`;

      /** Tìm dữ liệu trong cache */
      const CACHED_DATA = await REDIS_CLIENT.get(CACHE_KEY);

      /** Nếu dữ liệu tồn tại trong cache, giải mã và trả về */
      if (CACHED_DATA) {
        return JSON.parse(CACHED_DATA) as IWishlistWithProduct[];
      }

      /** Cache miss → query DB để lấy toàn bộ wishlist */
      const WISHLIST = await this.prisma.wishlist.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });

      /** Lưu kết quả vào cache với TTL 300 giây */
      if (WISHLIST.length > 0) {
        await REDIS_CLIENT.setex(
          CACHE_KEY,
          this.TTL,
          JSON.stringify(WISHLIST)
        );
      }

      /** Trả về danh sách wishlist */
      return WISHLIST;
    } catch (error) {
      /** Nếu cache gặp lỗi, log và tiếp tục sử dụng DB */
      console.error('[WishlistCache.getWishlist] Redis error:', error);
      
      /** Fallback: Query DB trực tiếp */
      return this.prisma.wishlist.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  /**
   * Lưu danh sách wishlist vào cache
   * 
   * @param userId - ID của user
   * @param wishlist - Mảng wishlist items cần lưu
   * 
   * @example
   * await cache.setWishlist(123, wishlistItems);
   * // Dữ liệu được lưu trong Redis với TTL 300 giây
   */
  async setWishlist(userId: number, wishlist: IWishlistWithProduct[]): Promise<void> {
    try {
      const { REDIS_CLIENT } = await this.redisConnection.exec({});
      const CACHE_KEY = `${this.PREFIX}list:${userId}`;

      /** Lưu vào cache với TTL */
      await REDIS_CLIENT.setex(
        CACHE_KEY,
        this.TTL,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      /** Nếu cache gặp lỗi, chỉ log mà không throw exception */
      /** Vì cache là tùy chọn, không ảnh hưởng đến functionality */
      console.error('[WishlistCache.setWishlist] Redis error:', error);
    }
  }

  /**
   * Xóa cache wishlist của user
   * 
   * Dùng để invalidate cache khi user thêm/xóa sản phẩm
   * 
   * @param userId - ID của user
   * 
   * @example
   * await cache.invalidateWishlist(123);
   * // Cache wishlist của user 123 bị xóa
   * // Lần tiếp theo GET sẽ query DB và tạo cache mới
   */
  async invalidateWishlist(userId: number): Promise<void> {
    try {
      const { REDIS_CLIENT } = await this.redisConnection.exec({});
      const CACHE_KEY = `${this.PREFIX}list:${userId}`;

      /** Xóa khóa cache */
      await REDIS_CLIENT.del(CACHE_KEY);
    } catch (error) {
      /** Log lỗi nhưng không throw exception */
      console.error('[WishlistCache.invalidateWishlist] Redis error:', error);
    }
  }

  /**
   * Kiểm tra nhanh xem sản phẩm có trong wishlist không
   * 
   * Thực hiện kiểm tra trên cache hoặc DB
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns true nếu sản phẩm có trong wishlist, false nếu không
   * 
   * @example
   * const isInWishlist = await cache.checkInWishlist(123, 'prod_456');
   * console.log(isInWishlist); // true hoặc false
   */
  async checkInWishlist(userId: number, productId: string): Promise<boolean> {
    try {
      /** Lấy danh sách wishlist (từ cache hoặc DB) */
      const WISHLIST = await this.getWishlist(userId);
      
      /** Kiểm tra xem productId có trong danh sách không */
      return WISHLIST.some(item => item.productId === productId);
    } catch (error) {
      /** Nếu lỗi xảy ra, fallback query DB trực tiếp */
      console.error('[WishlistCache.checkInWishlist] Error:', error);
      
      const EXISTING = await this.prisma.wishlist.findUnique({
        where: {
          userId_productId: { userId, productId }
        }
      });

      return !!EXISTING;
    }
  }
}
