/** Import các decorator để transform và validate dữ liệu từ query parameters */
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max,  } from 'class-validator';

/**
 * DTO để truy vấn danh sách wishlist với pagination
 * 
 * Dùng để validate query parameters khi client gửi request GET /wishlist?page=1&limit=10
 * Transform string query params thành number và validate constraints
 */
export class QueryWishlistDto {
  /**
   * Số trang muốn lấy (bắt đầu từ 1)
   * 
   * @default 1
   * @example 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page phải là số' })
  @Min(1, { message: 'Page phải >= 1' })
  page?: number = 1;

  /**
   * Số lượng items trên mỗi trang
   * 
   * @default 10
   * @min 1
   * @max 100
   * @example 10
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit phải là số' })
  @Min(1, { message: 'Limit phải >= 1' })
  @Max(100, { message: 'Limit tối đa 100 items' })
  limit?: number = 10;
}
