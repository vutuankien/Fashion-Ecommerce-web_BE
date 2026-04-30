/** Import các decorator từ NestJS */
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
/** Import PrismaService để truy vấn database */
import { PrismaService } from '@/prisma/prisma.service';
/** Import repository layer */
import { WishlistRepository } from './wishlist.repository';
/** Import cache layer */
import { WishlistCache } from './wishlist.cache';
/** Import interfaces */
import {
  IWishlistService,
  IAddWishlistResponse,
  IGetWishlistResponse,
  IRemoveWishlistResponse,
  ICheckWishlistResponse,
  IWishlistWithProduct
} from './interfaces/wishlist.interface';

/**
 * Service Layer cho Wishlist
 * 
 * Xử lý toàn bộ business logic:
 * - Validate dữ liệu đầu vào
 * - Gọi repository để thao tác DB
 * - Invalidate cache khi cần
 * - Handle các exception
 * 
 * Pattern: Repository → Service → Controller
 */
@Injectable()
export class WishlistService implements IWishlistService {
  /** Logger để ghi log các sự kiện */
  private readonly logger = new Logger(WishlistService.name);

  /**
   * Hàm khởi tạo các dependency
   * 
   * @param prisma - PrismaService
   * @param repository - Repository để thao tác DB
   * @param cache - Cache để quản lý Redis
   */
  constructor(
    /** PrismaService để query thông tin sản phẩm */
    private readonly prisma: PrismaService,
    /** Repository để thao tác wishlist database */
    private readonly repository: WishlistRepository = new WishlistRepository(),
    /** Cache để quản lý Redis wishlist */
    private readonly cache: WishlistCache = new WishlistCache()
  ) {}

  /**
   * Thêm sản phẩm vào wishlist
   * 
   * Quy trình:
   * 1. Validate sản phẩm tồn tại (product exists check)
   * 2. Tạo wishlist entry trong DB
   * 3. Nếu duplicate (P2002 error) → throw exception
   * 4. Invalidate cache
   * 5. Query đầy đủ wishlist entry với product details
   * 6. Trả về response
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Response với thông tin sản phẩm vừa thêm
   * @throws BadRequestException - Sản phẩm đã có trong wishlist
   * @throws NotFoundException - Sản phẩm không tồn tại
   * 
   * @example
   * const response = await service.addToWishlist(123, 'prod_456');
   * // Response: { success: true, message: "...", data: { id, product, createdAt } }
   */
  async addToWishlist(userId: number, productId: string): Promise<IAddWishlistResponse> {
    try {
      /** Validate sản phẩm tồn tại trong hệ thống */
      const PRODUCT = await this.prisma.products.findUnique({
        where: { id: productId }
      });

      /** Nếu sản phẩm không tồn tại */
      if (!PRODUCT) {
        this.logger.warn(`[addToWishlist] Product not found: ${productId}`);
        throw new NotFoundException(`Sản phẩm với ID ${productId} không tồn tại`);
      }

      /** Thêm vào wishlist */
      const WISHLIST_ITEM = await this.repository.create({
        userId,
        productId
      });

      this.logger.log(`[addToWishlist] User ${userId} added product ${productId} to wishlist`);

      /** Invalidate cache để lần tiếp theo được dữ liệu mới */
      await this.cache.invalidateWishlist(userId);

      /** Query lại để lấy đầy đủ thông tin sản phẩm */
      const WISHLIST_WITH_PRODUCT = await this.repository.findOne(userId, productId);

      /** Trả về response */
      return {
        message: 'Sản phẩm đã được thêm vào danh sách yêu thích',
        data: {
          id: WISHLIST_ITEM.id,
          product: WISHLIST_WITH_PRODUCT?.product!,
          createdAt: WISHLIST_ITEM.createdAt.toISOString()
        }
      };
    } catch (error: any) {
      /** Xử lý Prisma error P2002 (unique constraint violation) */
      if (error?.code === 'P2002') {
        this.logger.warn(`[addToWishlist] Duplicate wishlist for user ${userId}, product ${productId}`);
        throw new BadRequestException('Sản phẩm này đã có trong danh sách yêu thích của bạn');
      }

      /** Nếu là exception ta đã throw, re-throw */
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      /** Lỗi không mong muốn */
      this.logger.error(`[addToWishlist] Unexpected error:`, error);
      throw new BadRequestException('Lỗi khi thêm sản phẩm vào danh sách yêu thích');
    }
  }

  /**
   * Lấy danh sách wishlist của user
   * 
   * Quy trình:
   * 1. Validate page, limit
   * 2. Lấy từ cache (cache-aside pattern):
   *    - Nếu cache hit → áp dụng pagination
   *    - Nếu cache miss → query DB → set cache
   * 3. Trả về với pagination metadata
   * 
   * @param userId - ID của user
   * @param page - Trang muốn lấy (mặc định 1)
   * @param limit - Số items mỗi trang (mặc định 10)
   * @returns Response với danh sách wishlist và pagination info
   * 
   * @example
   * const response = await service.getWishlist(123, 1, 10);
   * // Response: { data: [...], pagination: { total, page, limit, totalPage } }
   */
  async getWishlistIds(userId: number): Promise<{ data: string[] }> {
    try {
      const ALL_WISHLIST = await this.cache.getWishlist(userId);
      const PRODUCT_IDS = ALL_WISHLIST.map(item => item.productId);
      
      this.logger.log(`[getWishlistIds] User ${userId} fetched wishlist IDs - Total: ${PRODUCT_IDS.length}`);
      
      return { data: PRODUCT_IDS };
    } catch (error: any) {
      this.logger.error(`[getWishlistIds] Error:`, error);
      throw new BadRequestException('Lỗi khi lấy danh sách ID yêu thích');
    }
  }

  async getWishlist(userId: number, page: number = 1, limit: number = 10): Promise<IGetWishlistResponse> {
    try {
      /** Validate và normalize page, limit */
      const PAGE_VAL = Math.max(1, page);
      const LIMIT_VAL = Math.max(1, Math.min(limit, 100));
      const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

      /** Lấy danh sách wishlist (từ cache hoặc DB) */
      const ALL_WISHLIST = await this.cache.getWishlist(userId);

      /** Lấy tổng số items */
      const TOTAL = ALL_WISHLIST.length;

      /** Áp dụng pagination */
      const PAGINATED_WISHLIST = ALL_WISHLIST.slice(SKIP, SKIP + LIMIT_VAL);

      /** Tính toán tổng số trang */
      const TOTAL_PAGE = Math.ceil(TOTAL / LIMIT_VAL) || 1;

      this.logger.log(`[getWishlist] User ${userId} fetched wishlist - Page: ${PAGE_VAL}, Limit: ${LIMIT_VAL}, Total: ${TOTAL}`);

      /** Trả về response */
      return {
        data: PAGINATED_WISHLIST.map(item => ({
          id: item.id,
          userId: item.userId,
          productId: item.productId,
          product: item.product,
          /** Xử lý createdAt có thể là string từ cache hoặc Date từ DB */
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : item.createdAt.toISOString(),
          /** Xử lý updatedAt có thể là string từ cache hoặc Date từ DB */
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : item.updatedAt.toISOString(),
        })),
        pagination: {
          total: TOTAL,
          page: PAGE_VAL,
          limit: LIMIT_VAL,
          totalPage: TOTAL_PAGE
        }
      };
    } catch (error: any) {
      this.logger.error(`[getWishlist] Error:`, error);
      throw new BadRequestException('Lỗi khi lấy danh sách yêu thích');
    }
  }

  /**
   * Xóa sản phẩm khỏi wishlist
   * 
   * Quy trình:
   * 1. Kiểm tra sản phẩm có trong wishlist không
   * 2. Xóa khỏi DB
   * 3. Invalidate cache
   * 4. Trả về response
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Response thành công
   * @throws NotFoundException - Sản phẩm không có trong wishlist
   * 
   * @example
   * const response = await service.removeFromWishlist(123, 'prod_456');
   * // Response: { success: true, message: "..." }
   */
  async removeFromWishlist(userId: number, productId: string): Promise<IRemoveWishlistResponse> {
    try {
      /** Kiểm tra sản phẩm có trong wishlist không */
      const EXISTING = await this.repository.findOne(userId, productId);

      if (!EXISTING) {
        this.logger.warn(`[removeFromWishlist] Product not in wishlist: user ${userId}, product ${productId}`);
        throw new NotFoundException('Sản phẩm này không có trong danh sách yêu thích của bạn');
      }

      /** Xóa khỏi DB */
      await this.repository.delete(userId, productId);

      this.logger.log(`[removeFromWishlist] User ${userId} removed product ${productId} from wishlist`);

      /** Invalidate cache */
      await this.cache.invalidateWishlist(userId);

      /** Trả về response */
      return {
        message: 'Sản phẩm đã được xóa khỏi danh sách yêu thích'
      };
    } catch (error: any) {
      /** Nếu là exception ta đã throw, re-throw */
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`[removeFromWishlist] Unexpected error:`, error);
      throw new BadRequestException('Lỗi khi xóa sản phẩm khỏi danh sách yêu thích');
    }
  }

  /**
   * Kiểm tra xem sản phẩm có trong wishlist không
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Response với cờ isInWishlist
   * 
   * @example
   * const response = await service.checkInWishlist(123, 'prod_456');
   * // Response: { data: true }
   */
  async checkInWishlist(userId: number, productId: string): Promise<ICheckWishlistResponse> {
    try {
      const IS_IN_WISHLIST = await this.cache.checkInWishlist(userId, productId);

      this.logger.debug(`[checkInWishlist] User ${userId} check product ${productId} - Result: ${IS_IN_WISHLIST}`);

      return {
        data: IS_IN_WISHLIST
      };
    } catch (error: any) {
      this.logger.error(`[checkInWishlist] Error:`, error);
      throw new BadRequestException('Lỗi khi kiểm tra sản phẩm');
    }
  }

  /**
   * Xóa toàn bộ wishlist của user
   * 
   * Quy trình:
   * 1. Xóa tất cả wishlist entries của user
   * 2. Invalidate cache
   * 3. Trả về response
   * 
   * @param userId - ID của user
   * @returns Response thành công
   * 
   * @example
   * const response = await service.clearWishlist(123);
   * // Response: { success: true, message: "..." }
   */
  async clearWishlist(userId: number): Promise<IRemoveWishlistResponse> {
    try {
      /** Xóa toàn bộ wishlist */
      const DELETED_COUNT = await this.repository.deleteAll(userId);

      this.logger.log(`[clearWishlist] User ${userId} cleared wishlist - Deleted ${DELETED_COUNT} items`);

      /** Invalidate cache */
      await this.cache.invalidateWishlist(userId);

      /** Trả về response */
      return {
        message: `Đã xóa ${DELETED_COUNT} sản phẩm khỏi danh sách yêu thích`
      };
    } catch (error: any) {
      this.logger.error(`[clearWishlist] Error:`, error);
      throw new BadRequestException('Lỗi khi xóa danh sách yêu thích');
    }
  }
}
