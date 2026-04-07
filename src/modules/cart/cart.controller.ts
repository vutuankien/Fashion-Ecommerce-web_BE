import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ICartService } from "./interface/cart.service.interface";
import { ICartWithItems } from "./interface/cart.type.interface";
import { CartService } from "./cart.service";

@Controller("cart")

export class CartController  {
  /** Hàm khởi tạo của CartController */
  constructor(
    /** Tiêm dịch vụ CartService */
    private readonly CART_SERVICE: CartService
  ) {}


  /** Lấy thông tin giỏ hàng hiện tại */
  @Get()
  /** Hàm xử lý lấy giỏ hàng của người dùng */
  async getCart(@Req() req: any) {
    /** 
     * Lấy định danh người dùng và phiên từ nhiều nguồn khác nhau để đảm bảo tính thương thích.
     * Ưu tiên: Context User (Auth) > Query Params > Headers.
     */
    const USER_ID = req.user?.id || req.query.userId;
    const SESSION_ID = req.headers['x-session-id'] || req.query.sessionId || req.sessionId;

    /** Thực hiện gọi service lấy giỏ hàng dựa trên thông tin định danh */
    const DATA = await this.CART_SERVICE.getActiveCart({
      /** Gán ID người dùng */
      userId: USER_ID ? Number(USER_ID) : undefined,
      /** Gán ID phiên vãng lai */
      sessionId: SESSION_ID,
    });

    /** Trả về kết quả dữ liệu giỏ hàng */
    return DATA;
  }
  /** Thêm mới sản phẩm vào giỏ hàng */
  @Post("/")
  /** Hàm xử lý thêm một sản phẩm hoặc cập nhật số lượng */
  async addItem(
    /** Nhận các tham số đầu vào từ body request */
    @Body()
    params: {
      userId?: number;
      sessionId?: string;
      productVariantId: string;
      quantity: number;
    },
    @Req() req: any
  ): Promise<ICartWithItems> {
    /** Ưu tiên lấy định danh từ body, sau đó đến header/user context */
    const USER_ID = params.userId || req.user?.id;
    const SESSION_ID = params.sessionId || req.headers['x-session-id'];

    /** Thực thi nghiệp vụ thêm sản phẩm thông qua CartService */
    return await this.CART_SERVICE.addItem({
      ...params,
      userId: USER_ID,
      sessionId: SESSION_ID,
    });
  }

  /** Cập nhật số lượng của sản phẩm trong giỏ */
  @Patch("/:id")
  /** Hàm xử lý thay đổi số lượng item */
  async updateItemQuantity(
    /** Nhận thông tin cập nhật từ body request */
    @Body()
    params: {
      userId?: number;
      sessionId?: string;
      productVariantId: string;
      quantity: number;
    },
    @Req() req: any
  ): Promise<ICartWithItems> {
    /** Ưu tiên lấy định danh từ body, sau đó đến header/user context */
    const USER_ID = params.userId || req.user?.id;
    const SESSION_ID = params.sessionId || req.headers['x-session-id'];

    /** Gọi service thực hiện việc cập nhật số lượng */
    return await this.CART_SERVICE.updateItemQuantity({
      ...params,
      userId: USER_ID,
      sessionId: SESSION_ID,
    });
  }

  /** Loại bỏ sản phẩm ra khỏi giỏ hàng */
  @Delete("/:id")
  /** Hàm xử lý xóa item */
  async removeItem(
    /** Nhận thông tin nhận diện sản phẩm cần xóa từ body */
    @Body()
    params: {
      userId?: number;
      sessionId?: string;
      productVariantId: string;
    },
    @Req() req: any
  ): Promise<ICartWithItems> {
    /** Ưu tiên lấy định danh từ body, sau đó đến header/user context */
    const USER_ID = params.userId || req.user?.id;
    const SESSION_ID = params.sessionId || req.headers['x-session-id'];

    /** Gọi service thực thi lệnh xóa sản phẩm */
    return await this.CART_SERVICE.removeItem({
      ...params,
      userId: USER_ID,
      sessionId: SESSION_ID,
    });
  }

  /** Xóa toàn bộ sản phẩm có trong giỏ hàng */
  @Delete("/clear")
  /** Hàm xử lý làm sạch giỏ hàng */
  async clearCart(
    /** Nhận thông tin người dùng từ body để xác định giỏ hàng */
    @Body()
    params: { userId?: number; sessionId?: string }
  ): Promise<void> {
    /** Gọi service yêu cầu xóa sạch item */
    return await this.CART_SERVICE.clearCart(params);
  }

  /** Hợp nhất giỏ hàng của khách vào tài khoản thành viên */
  @Post("/merge")
  /** Hàm xử lý gộp giỏ hàng sau khi đăng nhập */
  async mergeGuestCart(
    /** Nhận dữ liệu ID người dùng và ID phiên từ body */
    @Body()
    params: { userId: number; sessionId: string }
  ): Promise<ICartWithItems> {
    /** Thực hiện hợp nhất dữ liệu thông qua CartService */
    return await this.CART_SERVICE.mergeGuestCart(params);
  }

  /** Đánh dấu giỏ hàng là đã thanh toán thành công */
  @Patch("/checkout/:id")
  /** Hàm xử lý chuyển đổi trạng thái giỏ hàng sang checkout */
  async markCartCheckedOut(
    /** Nhận ID giỏ hàng từ tham số đường dẫn */
    @Param("id") cartId: string
  ): Promise<void> {
    /** Gọi service cập nhật trạng thái đã thanh toán */
    return await this.CART_SERVICE.markCartCheckedOut(cartId);
  }

}