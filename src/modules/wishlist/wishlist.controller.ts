/** Import các decorator từ NestJS */
import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Req,
  UnauthorizedException
} from '@nestjs/common';
/** Import service layer */
import { WishlistService } from './wishlist.service';
/** Import DTOs */
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
/** Import response helper để định dạng response */
import { ResponseHelper } from '@/helper/response.helper';
import { RolesGuard } from '../auth/roles.guard';
/** Import Roles decorator */
import { Roles } from '../auth/roles.decorator';

/**
 * Controller Layer cho Wishlist
 * 
 * Xử lý HTTP requests/responses cho wishlist endpoints
 * - Validate input từ request
 * - Gọi service để xử lý business logic
 * - Format response thống nhất
 * 
 * Các endpoint:
 * - POST /wishlist - Thêm sản phẩm
 * - GET /wishlist - Lấy danh sách
 * - DELETE /wishlist/:productId - Xóa sản phẩm
 * - GET /wishlist/check/:productId - Kiểm tra có trong wishlist
 * - DELETE /wishlist - Xóa toàn bộ
 * 
 * Authentication: JWT required trên tất cả endpoints
 */
@Controller('wishlist')
/** Sử dụng RolesGuard cho toàn bộ controller */
@UseGuards(RolesGuard)
export class WishlistController {
  /** Logger để ghi log các HTTP requests */
  private readonly logger = new Logger(WishlistController.name);

  /**
   * Hàm khởi tạo với service layer
   * 
   * @param wishlistService - Service xử lý business logic
   */
  constructor(
    /** Inject WishlistService để xử lý logic */
    private readonly wishlistService: WishlistService
  ) {}

  /**
   * Endpoint: POST /wishlist
   * 
   * Thêm sản phẩm vào wishlist của user
   * 
   * Request body:
   * {
   *   "productId": "prod_123"
   * }
   * 
   * Response (Success - 201):
   * {
   *   "data": {
   *     "id": "wish_abc123",
   *     "product": { id, name, image, price, ... },
   *     "createdAt": "2026-04-29T10:30:00Z"
   *   },
   *   "message": "Sản phẩm đã được thêm vào danh sách yêu thích",
   *   "statusCode": 201
   * }
   * 
   * Response (Error - 400):
   * {
   *   "message": "Sản phẩm này đã có trong danh sách yêu thích của bạn",
   *   "statusCode": 400
   * }
   * 
   * @param createDto - DTO chứa productId
   * @returns Response với wishlist item vừa thêm
   * @throws BadRequestException - Sản phẩm đã có trong wishlist
   * @throws NotFoundException - Sản phẩm không tồn tại
   * 
   * 
   * HTTP: POST /wishlist/user/:userId
   */
  @Post("/user/:userId")
  /** Chỉ user và admin mới được thêm vào wishlist */
  @Roles('user', 'admin')
  async addToWishlist(
    /** Nhận dữ liệu từ request body */
    @Body() createDto: CreateWishlistDto,
    /** Nhận userId từ path parameter */
    @Param('userId') userId: string
  ) {
    try {
      /** Nếu không có thông tin user */
      if (!userId) {
        this.logger.warn(`[addToWishlist] User ID not found in request`);
        throw new UnauthorizedException('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích');
      }

      const USER_ID = parseInt(userId, 10);
      if (isNaN(USER_ID)) {
        this.logger.warn(`[addToWishlist] Invalid User ID format: ${userId}`);
        throw new UnauthorizedException('User ID không hợp lệ');
      }

      this.logger.log(`[addToWishlist] New request - UserId: ${USER_ID}, ProductId: ${createDto.productId}`);

      /** Gọi service để thêm vào wishlist */
      const RESULT = await this.wishlistService.addToWishlist(
        USER_ID,
        createDto.productId
      );

      /** Trả về response với status 201 Created */
      return {
        data: RESULT.data,
        message: RESULT.message,
        statusCode: 201
      };
    } catch (error) {
      this.logger.error(`[addToWishlist] Error:`, error);
      throw error;
    }
  }

  /**
   * Endpoint: GET /wishlist/user/:userId/ids
   * 
   * Lấy danh sách ID sản phẩm trong wishlist của user
   * 
   * Response (Success - 200):
   * {
   *   "data": ["prod_123", "prod_456"],
   *   "message": "Lấy danh sách ID yêu thích thành công",
   *   "statusCode": 200
   * }
   */
  @Get("/user/:userId/ids")
  @Roles('user', 'admin')
  async getWishlistIds(
    @Param('userId') userId: string
  ) {
    try {
      if (!userId) {
        throw new UnauthorizedException('Vui lòng đăng nhập để xem danh sách yêu thích');
      }

      const USER_ID = parseInt(userId, 10);
      if (isNaN(USER_ID)) {
        throw new UnauthorizedException('User ID không hợp lệ');
      }

      const RESULT = await this.wishlistService.getWishlistIds(USER_ID);

      return {
        data: RESULT.data,
        message: 'Lấy danh sách ID yêu thích thành công',
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(`[getWishlistIds] Error:`, error);
      throw error;
    }
  }

  /**
   * Endpoint: GET /wishlist
   * 
   * Lấy danh sách wishlist của user với pagination
   * 
   * Query parameters:
   * - page: number (default: 1)
   * - limit: number (default: 10, max: 100)
   * 
   * Response (Success - 200):
   * {
   *   "data": [
   *     {
   *       "id": "wish_abc123",
   *       "product": { id, name, image, price, ... },
   *       "createdAt": "2026-04-29T10:30:00Z"
   *     },
   *     ...
   *   ],
   *   "pagination": {
   *     "total": 25,
   *     "page": 1,
   *     "limit": 10,
   *     "totalPage": 3
   *   },
   *   "message": "Lấy danh sách yêu thích thành công",
   *   "statusCode": 200
   * }
   * 
   * HTTP: GET /wishlist/user/:userId
   * 
   * @param query - Query parameters (page, limit)
   * @returns Response với danh sách wishlist và pagination info
   */
  @Get("/user/:userId")
  /** Chỉ user và admin mới được xem wishlist */
  @Roles('user', 'admin')
  async getWishlist(
    /** Nhận userId từ path parameter */
    @Param('userId') userId: string,
    /** Nhận query parameters */
    @Query() query: QueryWishlistDto
  ) {
    try {

      /** Lấy page từ query hoặc mặc định là 1 */
      const PAGE = query.page || 1;
      /** Lấy limit từ query hoặc mặc định là 10 */
      const LIMIT = query.limit || 10;

      /** Nếu không có thông tin user */
      if (!userId) {
        this.logger.warn(`[getWishlist] User ID not found in request`);
        throw new UnauthorizedException('Vui lòng đăng nhập để xem danh sách yêu thích');
      }

      const USER_ID = parseInt(userId, 10);
      if (isNaN(USER_ID)) {
        this.logger.warn(`[getWishlist] Invalid User ID format: ${userId}`);
        throw new UnauthorizedException('User ID không hợp lệ');
      }

      this.logger.log(`[getWishlist] New request - UserId: ${USER_ID}, Page: ${PAGE}, Limit: ${LIMIT}`);

      /** Gọi service để lấy danh sách */
      const RESULT = await this.wishlistService.getWishlist(
        USER_ID,
        PAGE,
        LIMIT
      );

      /** Trả về response với data và pagination */
      return {
        data: RESULT.data,
        pagination: RESULT.pagination,
        message: 'Lấy danh sách yêu thích thành công',
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(`[getWishlist] Error:`, error);
      throw error;
    }
  }

  /**
   * Endpoint: GET /wishlist/check/:productId
   * 
   * Kiểm tra xem sản phẩm có trong wishlist không
   * 
   * Path parameters:
   * - productId: string
   * 
   * Response (Success - 200):
   * {
   *   "data": {
   *     "isInWishlist": true
   *   },
   *   "message": "Kiểm tra thành công",
   *   "statusCode": 200
   * }
   * 
   * @param productId - ID của sản phẩm
   * @returns Response với cờ isInWishlist
   * 
   * 
   * HTTP: GET /wishlist/user/${userId}/product/${productId}
   */
  @Get('check/user/:userId/product/:productId')
  /** Chỉ user và admin mới được kiểm tra wishlist */
  @Roles('user', 'admin')
  async checkInWishlist(
    /** Nhận userId từ path parameter */
    @Param('userId') userId: string,
    /** Nhận productId từ path parameter */
    @Param('productId') productId: string
  ) {
    try {
      /** Nếu không có thông tin user */
      if (!userId) {
        this.logger.warn(`[checkInWishlist] User ID not found in request`);
        throw new UnauthorizedException('Vui lòng đăng nhập để kiểm tra danh sách yêu thích');
      }

      const USER_ID = parseInt(userId, 10);
      if (isNaN(USER_ID)) {
        this.logger.warn(`[checkInWishlist] Invalid User ID format: ${userId}`);
        throw new UnauthorizedException('User ID không hợp lệ');
      }

      this.logger.log(`[checkInWishlist] New request - UserId: ${USER_ID}, ProductId: ${productId}`);

      /** Gọi service để kiểm tra */
      const RESULT = await this.wishlistService.checkInWishlist(
        USER_ID,
        productId
      );

      /** Trả về response */
      return {
        data: RESULT.data,
        message: 'Kiểm tra thành công',
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(`[checkInWishlist] Error:`, error);
      throw error;
    }
  }

  /**
   * Endpoint: DELETE /wishlist/:productId
   * 
   * Xóa sản phẩm khỏi wishlist
   * 
   * Path parameters:
   * - productId: string
   * 
   * Response (Success - 200):
   * {
   *   "data": null,
   *   "message": "Sản phẩm đã được xóa khỏi danh sách yêu thích",
   *   "statusCode": 200
   * }
   * 
   * Response (Error - 404):
   * {
   *   "message": "Sản phẩm này không có trong danh sách yêu thích của bạn",
   *   "statusCode": 404
   * }
   * 
   * @param productId - ID của sản phẩm
   * @returns Response success
   * @throws NotFoundException - Sản phẩm không có trong wishlist
   * 
   * 
   * HTTP: DELETE /wishlist/user/${userId}/product/${productId}
   */
  @Delete('/user/:userId/product/:productId')
  /** Chỉ user và admin mới được xóa khỏi wishlist */
  @Roles('user', 'admin')
  async removeFromWishlist(
    /** Nhận userId từ path parameter */
    @Param('userId') userId: string,
    /** Nhận productId từ path parameter */
    @Param('productId') productId: string

  ) {
    try {
      /** Nếu không có thông tin user */
      if (!userId) {
        this.logger.warn(`[removeFromWishlist] User ID not found in request`);
        throw new UnauthorizedException('Vui lòng đăng nhập để xóa sản phẩm khỏi danh sách yêu thích');
      }

      const USER_ID = parseInt(userId, 10);
      if (isNaN(USER_ID)) {
        this.logger.warn(`[removeFromWishlist] Invalid User ID format: ${userId}`);
        throw new UnauthorizedException('User ID không hợp lệ');
      }

      this.logger.log(`[removeFromWishlist] New request - UserId: ${USER_ID}, ProductId: ${productId}`);

      /** Gọi service để xóa */
      const RESULT = await this.wishlistService.removeFromWishlist(
        USER_ID,
        productId
      );

      /** Trả về response */
      return {
        data: null,
        message: RESULT.message,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(`[removeFromWishlist] Error:`, error);
      throw error;
    }
  }

  /**
   * Endpoint: DELETE /wishlist
   * 
   * Xóa toàn bộ wishlist của user
   * 
   * Response (Success - 200):
   * {
   *   "data": null,
   *   "message": "Đã xóa 5 sản phẩm khỏi danh sách yêu thích",
   *   "statusCode": 200
   * }
   * 
   * @returns Response success
   * 
   * 
   * HTTP: DELETE /wishlist/user/${userId}
   */
  @Delete("/user/:userId/clear")
  /** Chỉ user và admin mới được xóa toàn bộ wishlist */
  @Roles('user', 'admin')
  async clearWishlist(
    /** Nhận userId từ path parameter */
    @Param('userId') userId: string
  ) {
    try {
      /** Nếu không có thông tin user */
      if (!userId) {
        this.logger.warn(`[clearWishlist] User ID not found in request`);
        throw new UnauthorizedException('Vui lòng đăng nhập để xóa danh sách yêu thích');
      }

      const USER_ID = parseInt(userId, 10);
      if (isNaN(USER_ID)) {
        this.logger.warn(`[clearWishlist] Invalid User ID format: ${userId}`);
        throw new UnauthorizedException('User ID không hợp lệ');
      }

      this.logger.log(`[clearWishlist] New request - UserId: ${USER_ID}`);

      /** Gọi service để xóa toàn bộ */
      const RESULT = await this.wishlistService.clearWishlist(
        USER_ID
      );

      /** Trả về response */
      return {
        data: null,
        message: RESULT.message,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(`[clearWishlist] Error:`, error);
      throw error;
    }
  }
}
