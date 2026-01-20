/** Import class-validator decorators */
import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsBoolean, IsNumber } from 'class-validator';
/** Import Type decorator */
import { Type } from 'class-transformer';

/** DTO cho query parameters của products */
export class QueryProductDto {
    /** Số trang hiện tại */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    /** Số lượng items mỗi trang */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    /** Từ khóa tìm kiếm theo tên, keyword, brand */
    @IsOptional()
    @IsString()
    search?: string;

    /** Trường để sắp xếp */
    @IsOptional()
    @IsIn(['name', 'price_at_counter', 'retail_price', 'sale_price', 'createdAt', 'updatedAt'])
    sortBy?: 'name' | 'price_at_counter' | 'retail_price' | 'sale_price' | 'createdAt' | 'updatedAt' = 'createdAt';

    /** Thứ tự sắp xếp */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    /** Giá tối thiểu */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    /** Giá tối đa */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    /** Lọc theo thương hiệu */
    @IsOptional()
    @IsString()
    brand?: string;

    /** Lọc theo loại sản phẩm */
    @IsOptional()
    @IsString()
    type?: string;

    /** Lọc theo trạng thái xuất bản */
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_published?: boolean;

    /** Lọc theo kho */
    @IsOptional()
    @IsString()
    warehouse_id?: string;
}
