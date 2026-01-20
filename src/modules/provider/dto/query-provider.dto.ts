/** Import class-validator decorators */
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
/** Import Type decorator */
import { Type } from 'class-transformer';

/** DTO cho query parameters của provider */
export class QueryProviderDto {
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

    /** Từ khóa tìm kiếm theo tên, số điện thoại */
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

    /** Lọc theo loại nhà cung cấp */
    @IsOptional()
    @IsString()
    typeProvider?: string;

    /** Lọc theo tỉnh/thành phố */
    @IsOptional()
    @IsString()
    province_id?: string;
}
