/** Import PrismaService để thực hiện các truy vấn database */
import { PrismaService } from '@/prisma/prisma.service';
/** Import interface định nghĩa các phương thức của repository */
import { IWishlistRepository, IWishlistWithProduct } from './interfaces/wishlist.interface';

/**
 * Repository Layer cho Wishlist
 * 
 * Chứa tất cả các phương thức để truy vấn database
 * Không chứa bất kỳ business logic nào
 * Chỉ truy vấn Prisma và trả về dữ liệu
 */
export class WishlistRepository implements IWishlistRepository {
  /**
   * Hàm khởi tạo với PrismaService
   * 
   * @param prisma - PrismaService được inject vào constructor
   */
  constructor(
    /** PrismaService để thực hiện các truy vấn database */
    private readonly prisma: PrismaService = new PrismaService()
  ) {}

  /**
   * Tìm danh sách wishlist của một user với pagination
   * 
   * @param userId - ID của user
   * @param limit - Số lượng items mỗi trang
   * @param skip - Số items bỏ qua (offset = (page - 1) * limit)
   * @returns Mảng các Wishlist item kèm thông tin sản phẩm đầy đủ
   * 
   * @example
   * const wishlist = await repo.findByUser(123, 10, 0);
   * // Trả về 10 items đầu tiên của user 123
   */
  async findByUser(userId: number, limit: number, skip: number): Promise<IWishlistWithProduct[]> {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        /** Kèm theo toàn bộ thông tin sản phẩm */
        product: true
      },
      take: limit,
      skip,
      /** Sắp xếp từ mới nhất đến cũ nhất */
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Đếm tổng số mục wishlist của một user
   * 
   * @param userId - ID của user
   * @returns Số lượng mục wishlist
   * 
   * @example
   * const total = await repo.count(123);
   * // Trả về tổng số wishlist items của user 123
   */
  async count(userId: number): Promise<number> {
    return this.prisma.wishlist.count({
      where: { userId }
    });
  }

  /**
   * Tìm một mục wishlist cụ thể
   * Dùng để kiểm tra xem sản phẩm đã có trong wishlist hay chưa
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Wishlist item nếu tồn tại (kèm product details), null nếu không
   * 
   * @example
   * const existing = await repo.findOne(123, 'prod_456');
   * if (existing) {
   *   throw new Error('Sản phẩm đã có trong wishlist');
   * }
   */
  async findOne(userId: number, productId: string): Promise<IWishlistWithProduct | null> {
    return this.prisma.wishlist.findUnique({
      where: {
        /** Sử dụng composite unique key (userId_productId) được định nghĩa trong Prisma schema */
        userId_productId: { userId, productId }
      },
      include: {
        product: true
      }
    });
  }

  /**
   * Tạo mới một mục wishlist
   * 
   * @param data - Object chứa userId và productId
   * @returns Wishlist item vừa được tạo
   * @throws PrismaClientKnownRequestError (P2002) - Nếu sản phẩm đã có trong wishlist
   * @throws PrismaClientKnownRequestError (P2025) - Nếu product_id không tồn tại
   * 
   * @example
   * const wishlist = await repo.create({
   *   userId: 123,
   *   productId: 'prod_456'
   * });
   */
  async create(data: { userId: number; productId: string }): Promise<Wishlist> {
    return this.prisma.wishlist.create({
      data: {
        userId: data.userId,
        productId: data.productId
      },
      include: {
        product: true
      }
    });
  }

  /**
   * Xóa một mục wishlist cụ thể
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Số mục bị xóa (0 nếu không tồn tại, 1 nếu xóa thành công)
   * 
   * @example
   * const deleted = await repo.delete(123, 'prod_456');
   * if (deleted === 0) {
   *   throw new Error('Sản phẩm không có trong wishlist');
   * }
   */
  async delete(userId: number, productId: string): Promise<number> {
    const result = await this.prisma.wishlist.deleteMany({
      where: {
        userId,
        productId
      }
    });
    return result.count;
  }

  /**
   * Xóa toàn bộ wishlist của một user
   * 
   * @param userId - ID của user
   * @returns Số mục bị xóa
   * 
   * @example
   * const deleted = await repo.deleteAll(123);
   * console.log(`Đã xóa ${deleted} items từ wishlist`);
   */
  async deleteAll(userId: number): Promise<number> {
    const result = await this.prisma.wishlist.deleteMany({
      where: { userId }
    });
    return result.count;
  }
}

/** Import type Wishlist từ Prisma để khai báo kiểu trả về */
import type { Wishlist } from '@prisma/client';
