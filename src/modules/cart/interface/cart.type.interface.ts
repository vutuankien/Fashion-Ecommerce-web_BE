/** Import chính cho các kiểu dữ liệu của giỏ hàng */

/**
 * Kiểu union định nghĩa các trạng thái hợp lệ của giỏ hàng
 */
export type ICartStatus = 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';

/**
 * Interface cấu trúc của một item hiển thị trong giỏ hàng
 */
export interface ICartItemView {
    /** ID duy nhất của item */
    id: string;
    /** ID của sản phẩm mẹ */
    productId: string;
    /** ID của phiên bản sản phẩm cụ thể */
    productVariantId: string;
    /** Số lượng đã đặt */
    quantity: number;

    /** Thông tin sản phẩm cơ bản */
    product: {
        /** ID của sản phẩm */
        id: string;
        /** Tên hiển thị của sản phẩm */
        name: string;
    };

    /** Thông tin chi tiết về phiên bản (màu sắc, kích thước...) */
    variant: {
        /** ID của phiên bản */
        id: string;
        /** Mã SKU quản lý kho */
        sku: string;
        /** Đơn giá tại thời điểm thêm vào giỏ */
        price: number;
        /** Số lượng còn lại trong kho */
        stock: number;
        /** Các thuộc tính đã chọn (ví dụ: Size: L, Color: Red) */
        options: {
            /** Tên thuộc tính (code) */
            name: string;
            /** Giá trị hiển thị */
            value: string;
        }[];
    };
}

/**
 * Interface đầy đủ của giỏ hàng bao gồm danh sách sản phẩm
 */
export interface ICartWithItems {
    /** ID duy nhất của giỏ hàng */
    id: string;
    /** Trạng thái hiện tại của giỏ hàng */
    status: ICartStatus;
    /** Danh sách các sản phẩm đang có trong giỏ */
    items: ICartItemView[];
    /** Ngày tạo giỏ hàng */
    createdAt: Date;
    /** Ngày cập nhật giỏ hàng gần nhất */
    updatedAt: Date;
}