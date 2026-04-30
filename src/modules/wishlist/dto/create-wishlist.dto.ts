/** Import các decorator để validate dữ liệu từ class-validator */
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO để tạo mới một mục wishlist
 * 
 * Dùng để validate request body khi client gửi request thêm sản phẩm vào wishlist
 * Đảm bảo dữ liệu nhập vào hợp lệ trước khi xử lý ở service layer
 */
export class CreateWishlistDto {
  /**
   * ID của sản phẩm muốn thêm vào wishlist
   * 
   * @example "prod_123abc"
   */
  @IsString({ message: 'Product ID phải là chuỗi' })
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  productId!: string;
}
