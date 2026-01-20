/** Import class-validator decorators */
import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsBoolean } from 'class-validator';
/** Import Type decorator */
import { Type } from 'class-transformer';

/** DTO cho query parameters của warehouse */
export class QueryWarehouseDto {
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

    /** Từ khóa tìm kiếm theo tên, địa chỉ, số điện thoại */
    @IsOptional()
    @IsString()
    search?: string;

    /** Trường để sắp xếp */
    @IsOptional()
    @IsIn(['name', 'createdAt', 'updatedAt'])
    sortBy?: 'name' | 'createdAt' | 'updatedAt' = 'createdAt';

    /** Thứ tự sắp xếp */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    /** Lọc theo tỉnh/thành phố */
    @IsOptional()
    @IsString()
    province_id?: string;

    /** Lọc theo quận/huyện */
    @IsOptional()
    @IsString()
    district_id?: string;

    /** Lọc theo khả năng tạo đơn hàng */
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    allow_create_order?: boolean;
}
