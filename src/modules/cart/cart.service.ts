/** Import thư viện nestjs để tiêm phụ thuộc và xử lý lỗi */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
/** Import giao diện dịch vụ giỏ hàng */
import { ICartService } from './interface/cart.service.interface';
/** Import cấu trúc dữ liệu giỏ hàng phối hợp item */
import { ICartWithItems } from './interface/cart.type.interface';
/** Import dịch vụ prisma để truy vấn dữ liệu */
import { PrismaService } from 'src/prisma/prisma.service';
/** Import enum trạng thái giỏ hàng từ prisma client */
import { CartStatus } from '@prisma/client';

/** Lớp dịch vụ quản lý các nghiệp vụ liên quan đến giỏ hàng */
@Injectable()
export class CartService implements ICartService {
  /** Khởi tạo dịch vụ với prisma service */
  constructor(private readonly prisma: PrismaService) {}
  
  /** Phương thức lấy giỏ hàng hiện đang hoạt động */
  async getActiveCart(params: { userId?: number; sessionId?: string; }): Promise<ICartWithItems | null> {

    /** Xây dựng điều kiện tìm kiếm linh hoạt dựa trên userId hoặc sessionId */
    const WHERE_CLAUSE = {
      /** Lọc theo trạng thái đang hoạt động của giỏ hàng */
      status: CartStatus.ACTIVE,
      /** Tìm theo id khách hàng hoặc phiên định danh khách */
      OR: [
        /** Trải mảng điều kiện userId nếu có giá trị */
        ...(params.userId ? [{ userId: params.userId }] : []),
        /** Trải mảng điều kiện sessionId nếu có giá trị */
        ...(params.sessionId ? [{ sessionId: params.sessionId }] : []),
      ],
    };

    /** Truy vấn giỏ hàng từ cơ sở dữ liệu với các quan hệ liên quan */
    const CART = await this.prisma.cart.findFirst({
      where: WHERE_CLAUSE,
      /** Bao gồm thông tin các sản phẩm và biến thể trong giỏ */
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                attrs: {
                  include: {
                    attributeValue: {
                      include: {
                        Attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    /** Kiểm tra sự tồn tại của dữ liệu giỏ hàng vừa truy vấn */
    if(!CART) return null; /** Trả về null nếu không tìm thấy giỏ hàng */

    /** Trả về dữ liệu giỏ hàng chuẩn hóa theo interface ICartWithItems */
    return {
      id: CART.id,
      status: CART.status,
      createdAt: CART.createdAt,
      updatedAt: CART.updatedAt,
      /** Chuyển đổi dữ liệu prisma sang định dạng hiển thị cho frontend */
      items: CART.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
        },
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          price: item.variant.price,
          stock: item.variant.stock,
          /** Ánh xạ các thuộc tính động của biến thể */
          options: item.variant.attrs.map(attr => ({
            name: attr.attributeValue.Attribute.code,
            value: attr.attributeValue.label,
          })),
        },
      })),
    };
  }

  /** Thêm một sản phẩm mới vào giỏ hàng hoặc cập nhật số lượng nếu đã tồn tại */
  async addItem(params: { userId?: number; sessionId?: string; productVariantId: string; quantity: number; }): Promise<ICartWithItems> {
    /** Kiểm tra dữ liệu đầu vào, yêu cầu định danh người dùng hoặc khách */
    if(!params.userId && !params.sessionId) throw new NotFoundException('User ID or Session ID is required'); 

    /** Kiểm tra số lượng yêu cầu hợp lệ */
    if(params.quantity <= 0) throw new BadRequestException('Quantity must be greater than 0'); 

    /** Tìm kiếm giỏ hàng đang hoạt động hiện tại */
    let target_cart = await this.getActiveCart(params); /** Biến let snake_case */

    /** Nếu chưa có giỏ hàng thì tiến hành khởi tạo mới */
    if(!target_cart) {
      /** Tạo bản ghi giỏ hàng mới trong DB */
      const CREATED_CART = await this.prisma.cart.create({ /** Hằng số SNAKE_CASE_UPPER */
        data: {
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });
      /** Chuẩn bị dữ liệu giỏ hàng tạm thời để xử lý tiếp */
      target_cart = { ...CREATED_CART, items: [] };
    }

    /** Truy vấn thông tin chi tiết của biến thể sản phẩm */
    const PRODUCT_VARIANT = await this.prisma.productVariant.findUnique({
      where: { id: params.productVariantId },
      include: { product: true },
    });

    /** Kiểm tra sự tồn tại của biến thể sản phẩm */
    if(!PRODUCT_VARIANT) throw new NotFoundException('Product variant not found'); 

    /** Đảm bảo sản phẩm mẹ đang hoạt động */
    if(!PRODUCT_VARIANT.product.is_published) throw new BadRequestException('Product is currently not available'); 

    /** Kiểm tra tồn kho cho lượt thêm mới */
    if(PRODUCT_VARIANT.stock < params.quantity) throw new BadRequestException('Product variant is out of stock'); 

    /** Tìm kiếm item trong giỏ hàng hiện tại */
    const EXISTING_ITEM = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: target_cart.id,
          productVariantId: params.productVariantId,
        },
      },
    });

    /** Cập nhật số lượng nếu sản phẩm đã có trong giỏ */
    if(EXISTING_ITEM) {
      /** Tính tổng số lượng mới */
      const NEW_QUANTITY = EXISTING_ITEM.quantity + params.quantity;
      /** Kiểm tra tồn kho với tổng số lượng mới */
      if(NEW_QUANTITY > PRODUCT_VARIANT.stock) throw new BadRequestException('Not enough stock for total quantity'); 
      /** Cập nhật vào cơ sở dữ liệu */
      await this.prisma.cartItem.update({
        where: { id: EXISTING_ITEM.id },
        data: { quantity: NEW_QUANTITY },
      });
    } else { /** Thêm mới sản phẩm vào giỏ hàng */
      /** Kiểm tra tồn kho trước khi tạo mới */
      if(params.quantity > PRODUCT_VARIANT.stock) throw new BadRequestException('Not enough inventory'); 
      /** Tạo bản ghi item mới trong DB */
      await this.prisma.cartItem.create({
        data: {
          cartId: target_cart.id,
          productId: PRODUCT_VARIANT.productId,
          productVariantId: params.productVariantId,
          quantity: params.quantity,
        },
      });
    }

    /** Trả về giỏ hàng đã được cập nhật */
    const UPDATED_CART = await this.getActiveCart(params);
    /** Đảm bảo không trả về null sau khi đã thực hiện xong các bước */
    if(!UPDATED_CART) throw new BadRequestException('Failed to retrieve updated cart'); 
    /** Trả về kết quả */
    return UPDATED_CART;
  }

  /** Cập nhật số lượng của một sản phẩm trong giỏ hàng */
  async updateItemQuantity(params: {
    userId?: number;
    sessionId?: string;
    productVariantId: string;
    quantity: number;
  }): Promise<ICartWithItems> {

    /** Kiểm tra tính hợp lệ của định danh khách hàng hoặc phiên vãng lai */
    if (!params.userId && !params.sessionId) throw new BadRequestException('User ID or Session ID is required'); /** Phá ngoặc nhọn if */

    /** Đảm bảo số lượng yêu cầu cập nhật không được là số âm */
    if (params.quantity < 0) throw new BadRequestException('Quantity must be >= 0'); /** Phá ngoặc nhọn if */

    /** Thực hiện tuần tự các thao tác cập nhật thông qua giao dịch DB để bảo đảm nhất quán */
    const UPDATED_RESULT = await this.prisma.$transaction(async (tx) => {

      /** Truy tìm giỏ hàng hiện đang ở trạng thái hoạt động của khách */
      const CART = await tx.cart.findFirst({
        where: {
          /** Lọc theo trạng thái đang hoạt động của giỏ hàng */
          status: CartStatus.ACTIVE,
          /** Lọc theo ID người dùng hoặc ID phiên */
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });

      /** Báo lỗi nếu hệ thống không tìm thấy giỏ hàng đang hoạt động nào */
      if (!CART) throw new NotFoundException('Cart not found'); /** Phá ngoặc nhọn if */

      /** Tìm kiếm bản ghi chi tiết sản phẩm cụ thể nằm trong giỏ hàng đó */
      const CART_ITEM = await tx.cartItem.findUnique({
        where: {
          /** Sử dụng khóa kết hợp ID giỏ hàng và ID biến thể sản phẩm */
          cartId_productVariantId: {
            cartId: CART.id,
            productVariantId: params.productVariantId,
          },
        },
      });

      /** Thông báo lỗi khi sản phẩm không có mặt trong danh sách giỏ hàng */
      if (!CART_ITEM) throw new NotFoundException('Cart item not found'); /** Phá ngoặc nhọn if */

      /** Nghiệp vụ đặc biệt: Nếu người dùng đặt số lượng về 0 thì tiến hành xóa item */
      if (params.quantity === 0) {
        /** Loại bỏ bản ghi cart item khỏi cơ sở dữ liệu */
        await tx.cartItem.delete({
          where: {
            cartId_productVariantId: {
              cartId: CART.id,
              productVariantId: params.productVariantId,
            },
          },
        });

        /** Truy cập dữ liệu tổng quan mới nhất sau khi đã xóa thành công */
        return await this.getActiveCart(params); /** Trả về kết quả phục vụ giao dịch */
      }

      /** Lấy dữ liệu chi tiết của phiên bản sản phẩm để đối chiếu điều kiện bán */
      const PRODUCT_VARIANT = await tx.productVariant.findUnique({
        where: { id: params.productVariantId },
        /** Bao gồm thông tin sản phẩm mẹ để kiểm tra trạng thái hiển thị */
        include: { product: true },
      });

      /** Đảm bảo biến thể sản phẩm vẫn còn tồn tại hợp lệ trên hệ thống */
      if (!PRODUCT_VARIANT) throw new NotFoundException('Product variant not found'); /** Phá ngoặc nhọn if */

      /** Kiểm tra sản phẩm mẹ đã được xuất bản và cho phép kinh doanh chưa */
      if (!PRODUCT_VARIANT.product.is_published) throw new BadRequestException('Product is not available'); /** Phá ngoặc nhọn if */

      /** Ngăn chặn việc đặt hàng vượt quá số lượng hàng thực tế còn trong kho */
      if (PRODUCT_VARIANT.stock < params.quantity) throw new BadRequestException('Not enough stock'); /** Phá ngoặc nhọn if */

      /** Ghi nhận số lượng mới vào bản ghi item trong cơ sở dữ liệu */
      await tx.cartItem.update({
        where: {
          cartId_productVariantId: {
            cartId: CART.id,
            productVariantId: params.productVariantId,
          },
        },
        data: { quantity: params.quantity },
      });

      /** Truy xuất lại giỏ hàng chi tiết sau khi mọi thay đổi đã được áp dụng */
      return await this.getActiveCart(params); /** Trả về kết quả phục vụ giao dịch */
    });

    /** Kiểm tra dữ liệu cuối cùng để giải quyết lỗi Type, đảm bảo không trả về null */
    if (!UPDATED_RESULT) throw new BadRequestException('Failed to retrieve updated cart'); /** Phá ngoặc nhọn if */

    /** Trả về thông tin giỏ hàng chi tiết đáp ứng đúng kiểu ICartWithItems */
    return UPDATED_RESULT;
  }

  /** Loại bỏ sản phẩm khỏi giỏ hàng */
  async removeItem(params: { userId?: number; sessionId?: string; productVariantId: string; }): Promise<ICartWithItems> {
    //validate input
    if (!params.userId && !params.sessionId) throw new BadRequestException('User ID or Session ID is required'); 
    if (!params.productVariantId) throw new BadRequestException('Product variant ID is required');
     

    const REMOVED_RESULT = await this.prisma.$transaction(async (tx) => {
      const CART = await tx.cart.findFirst({
        where: {
          /** Lọc theo trạng thái đang hoạt động của giỏ hàng */
          status: CartStatus.ACTIVE,
          /** Lọc theo ID người dùng hoặc ID phiên */
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });

      if (!CART) throw new NotFoundException('Cart not found');

      //get active cart as a target cart
      const cart = await tx.cart.findFirst({
        where: {
          status: CartStatus.ACTIVE,
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });

      if(!cart) throw new NotFoundException('Cart not found');

      const CART_ITEM = await tx.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: params.productVariantId,
          },
        },
      });

      if(!CART_ITEM) throw new NotFoundException('Cart item not found');

      await tx.cartItem.delete({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: params.productVariantId,
          },
        },
      });

      return await this.getActiveCart(params);
    })

    if(!REMOVED_RESULT) throw new BadRequestException('Failed to remove cart item');

    return REMOVED_RESULT;
    
  }

  /** Xóa sạch giỏ hàng hiện tại */
  async clearCart(params: { userId?: number; sessionId?: string; }): Promise<void> {
    //validate input
    if (!params.userId && !params.sessionId) throw new BadRequestException('User ID or Session ID is required');

    //Start transaction
    await this.prisma.$transaction(async (tx) => {
      const CART = await tx.cart.findFirst({
        where: {
          status: CartStatus.ACTIVE,
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });

      if(!CART) throw new NotFoundException('Cart not found');

      //delete all cart items
      await tx.cartItem.deleteMany({
        where: {
          cartId: CART.id,
        },
      });

    })
  }

  /** Hợp nhất giỏ hàng khách vào giỏ hàng thành viên */
  async mergeGuestCart(params: { userId: number; sessionId: string; }): Promise<ICartWithItems> {
    //validate input
    if (!params.userId && !params.sessionId) throw new BadRequestException('User ID or Session ID is required');

    const MERGED_RESULT = await this.prisma.$transaction(async (tx) => {
      const CART = await tx.cart.findFirst({
        where: {
          status: CartStatus.ACTIVE,
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });

      if(!CART) throw new NotFoundException('Cart not found');

      const cart = await tx.cart.findFirst({
        where: {
          status: CartStatus.ACTIVE,
          userId: params.userId,
          sessionId: params.sessionId,
        },
      });

      if(!cart) throw new NotFoundException('Cart not found');

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return await this.getActiveCart(params);
    })

    if(!MERGED_RESULT) throw new BadRequestException('Failed to merge cart');

    return MERGED_RESULT;
  }

  /** Đánh dấu trạng thái giỏ hàng đã hoàn tất thanh toán */
  async markCartCheckedOut(cartId: string): Promise<void> {

    /** Validate input */
    if (!cartId) {
      throw new BadRequestException('Cart ID is required');
    }

    await this.prisma.$transaction(async (tx) => {

      /** Get cart */
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        select: { id: true, status: true },
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      /** Validate cart status */
      if (cart.status === CartStatus.ABANDONED) {
        throw new BadRequestException('Cannot checkout an abandoned cart');
      }

      /** Idempotent: already checked out */
      if (cart.status === CartStatus.CHECKED_OUT) {
        return;
      }

      /** Update status */
      await tx.cart.update({
        where: { id: cartId },
        data: {
          status: CartStatus.CHECKED_OUT,
        },
      });
    });
  }
}
