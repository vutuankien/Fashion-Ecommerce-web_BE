

/** Import Prism Client để sử dụng các kiểu dữ liệu từ DB */
import { Cart, CartItem } from '@prisma/client';
/** Import interface giỏ hàng từ file type */
import { ICartWithItems } from './cart.type.interface';

/** Interface định nghĩa các phương thức xử lý nghiệp vụ giỏ hàng */
export interface ICartService {
    /** Lấy giỏ hàng đang hoạt động của người dùng hoặc phiên khách */
    getActiveCart(params: {
        /** ID của người dùng nếu đã đăng nhập */
        userId?: number;
        /** ID phiên nếu là khách hàng vãng lai */
        sessionId?: string;
    }): Promise<ICartWithItems | null>;

    /** Thêm một sản phẩm mới hoặc tăng số lượng trong giỏ hàng */
    addItem(params: {
        /** ID người dùng */
        userId?: number;
        /** ID phiên khách */
        sessionId?: string;
        /** ID phiên bản sản phẩm cần thêm */
        productVariantId: string;
        /** Số lượng cần thêm */
        quantity: number;
    }): Promise<ICartWithItems>;

    /** Cập nhật số lượng của một sản phẩm đã có trong giỏ */
    updateItemQuantity(params: {
        /** ID người dùng */
        userId?: number;
        /** ID phiên khách */
        sessionId?: string;
        /** ID phiên bản sản phẩm cần cập nhật */
        productVariantId: string;
        /** Số lượng mới */
        quantity: number;
    }): Promise<ICartWithItems>;

    /** Loại bỏ một sản phẩm hoàn toàn khỏi giỏ hàng */
    removeItem(params: {
        /** ID người dùng */
        userId?: number;
        /** ID phiên khách */
        sessionId?: string;
        /** ID phiên bản sản phẩm cần xóa */
        productVariantId: string;
    }): Promise<ICartWithItems>;

    /** Xóa toàn bộ sản phẩm trong giỏ hàng hiện tại */
    clearCart(params: {
        /** ID người dùng */
        userId?: number;
        /** ID phiên khách */
        sessionId?: string;
    }): Promise<void>;

    /** Chuyển sản phẩm từ giỏ hàng khách sang giỏ hàng thành viên khi đăng nhập */
    mergeGuestCart(params: {
        /** ID thành viên mục tiêu */
        userId: number;
        /** ID phiên khách nguồn */
        sessionId: string;
    }): Promise<ICartWithItems>;

    /** Đánh dấu cart đã checkout (internal use) */
    markCartCheckedOut(cartId: string): Promise<void>;
}