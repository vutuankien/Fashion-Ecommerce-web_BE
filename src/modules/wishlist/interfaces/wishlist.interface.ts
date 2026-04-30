/** Import Wishlist model từ Prisma client */
import { Wishlist, products } from '@prisma/client';

/**
 * Interface mở rộng Wishlist model từ Prisma
 * Kết hợp Wishlist với toàn bộ thông tin của Product
 */
export interface IWishlistWithProduct extends Wishlist {
  /** Thông tin chi tiết sản phẩm đi kèm */
  product: products;
}

/**
 * Interface định nghĩa response khi thêm sản phẩm vào wishlist
 */
export interface IAddWishlistResponse {
  /** Thông báo cho client */
  message: string;
  /** Dữ liệu trả về */
  data: {
    /** ID của mục wishlist */
    id: string;
    /** Thông tin sản phẩm vừa thêm */
    product: products;
    /** Thời gian tạo */
    createdAt: string;
  };
}

/**
 * Interface định nghĩa response khi lấy danh sách wishlist
 */
export interface IGetWishlistResponse {
  /** Danh sách các mục wishlist với thông tin sản phẩm */
  data: {
    id: string;
    product: products;
    createdAt: string;
  }[];
  /** Thông tin phân trang */
  pagination: {
    /** Tổng số mục wishlist của user */
    total: number;
    /** Trang hiện tại */
    page: number;
    /** Số lượng items trên trang */
    limit: number;
    /** Tổng số trang */
    totalPage: number;
  };
}

/**
 * Interface định nghĩa response khi xóa sản phẩm khỏi wishlist
 */
export interface IRemoveWishlistResponse {
  /** Thông báo cho client */
  message: string;
}

/**
 * Interface định nghĩa response khi kiểm tra sản phẩm có trong wishlist không
 */
export interface ICheckWishlistResponse {
  /** Dữ liệu trả về */
  data: boolean;
}

/**
 * Interface định nghĩa Repository Layer cho Wishlist
 * Chứa các phương thức để truy vấn database
 */
export interface IWishlistRepository {
  /**
   * Tìm danh sách wishlist của một user theo trang
   * 
   * @param userId - ID của user
   * @param limit - Số lượng items mỗi trang
   * @param skip - Số items bỏ qua (offset)
   * @returns Mảng các Wishlist item với product details
   */
  findByUser(userId: number, limit: number, skip: number): Promise<IWishlistWithProduct[]>;

  /**
   * Đếm tổng số mục wishlist của một user
   * 
   * @param userId - ID của user
   * @returns Tổng số mục
   */
  count(userId: number): Promise<number>;

  /**
   * Tìm một mục wishlist cụ thể của user
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Wishlist item nếu tồn tại, null nếu không
   */
  findOne(userId: number, productId: string): Promise<Wishlist | null>;

  /**
   * Tạo mới một mục wishlist
   * 
   * @param data - Dữ liệu { userId, productId }
   * @returns Wishlist item vừa tạo
   */
  create(data: { userId: number; productId: string }): Promise<Wishlist>;

  /**
   * Xóa một mục wishlist
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Số mục bị xóa (0 nếu không tồn tại)
   */
  delete(userId: number, productId: string): Promise<number>;

  /**
   * Xóa toàn bộ wishlist của một user
   * 
   * @param userId - ID của user
   * @returns Số mục bị xóa
   */
  deleteAll(userId: number): Promise<number>;
}

/**
 * Interface định nghĩa Cache Layer cho Wishlist
 * Chứa các phương thức để quản lý cache Redis
 */
export interface IWishlistCache {
  /**
   * Lấy danh sách wishlist của user từ cache
   * Nếu không có trong cache, lấy từ DB rồi set cache
   * 
   * @param userId - ID của user
   * @returns Mảng wishlist items, rỗng nếu không có
   */
  getWishlist(userId: number): Promise<IWishlistWithProduct[]>;

  /**
   * Lưu danh sách wishlist vào cache với TTL 300 giây
   * 
   * @param userId - ID của user
   * @param wishlist - Danh sách wishlist cần lưu
   */
  setWishlist(userId: number, wishlist: IWishlistWithProduct[]): Promise<void>;

  /**
   * Xóa cache wishlist của user
   * 
   * @param userId - ID của user
   */
  invalidateWishlist(userId: number): Promise<void>;

  /**
   * Kiểm tra nhanh xem sản phẩm có trong wishlist không
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns True nếu có, false nếu không
   */
  checkInWishlist(userId: number, productId: string): Promise<boolean>;
}

/**
 * Interface định nghĩa Service Layer cho Wishlist
 * Chứa các phương thức xử lý business logic
 */
export interface IWishlistService {
  /**
   * Thêm sản phẩm vào wishlist của user
   * - Validate sản phẩm tồn tại
   * - Kiểm tra không thêm duplicate (unique constraint)
   * - Thêm vào DB
   * - Invalidate cache
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Response với thông tin sản phẩm vừa thêm
   * @throws BadRequestException - Nếu sản phẩm đã có trong wishlist
   * @throws NotFoundException - Nếu sản phẩm không tồn tại
   */
  addToWishlist(userId: number, productId: string): Promise<IAddWishlistResponse>;

  /**
   * Lấy danh sách ID các sản phẩm trong wishlist
   * @param userId - ID của user
   */
  getWishlistIds(userId: number): Promise<{ data: string[] }>;

  /**
   * Lấy danh sách wishlist của user
   * - Check cache trước
   * - Nếu cache miss, lấy từ DB
   * - Set cache cho lần sau
   * 
   * @param userId - ID của user
   * @param page - Số trang (bắt đầu từ 1)
   * @param limit - Số items mỗi trang
   * @returns Response với danh sách wishlist và phân trang
   */
  getWishlist(userId: number, page: number, limit: number): Promise<IGetWishlistResponse>;

  /**
   * Xóa sản phẩm khỏi wishlist
   * - Kiểm tra sản phẩm có trong wishlist không
   * - Xóa khỏi DB
   * - Invalidate cache
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Response thành công
   * @throws NotFoundException - Nếu sản phẩm không có trong wishlist
   */
  removeFromWishlist(userId: number, productId: string): Promise<IRemoveWishlistResponse>;

  /**
   * Kiểm tra xem sản phẩm có trong wishlist không
   * 
   * @param userId - ID của user
   * @param productId - ID của sản phẩm
   * @returns Response với cờ isInWishlist
   */
  checkInWishlist(userId: number, productId: string): Promise<ICheckWishlistResponse>;

  /**
   * Xóa toàn bộ wishlist của user
   * - Xóa tất cả items khỏi DB
   * - Invalidate cache
   * 
   * @param userId - ID của user
   * @returns Response thành công
   */
  clearWishlist(userId: number): Promise<IRemoveWishlistResponse>;
}
