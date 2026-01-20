/** Import class-validator decorators */
import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsNumber } from 'class-validator';
/** Import Type decorator */
import { Type } from 'class-transformer';

/** DTO cho query parameters của employer */
export class QueryEmployerDto {
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

    /** Từ khóa tìm kiếm theo tên, email, số điện thoại */
    @IsOptional()
    @IsString()
    search?: string;

    /** Trường để sắp xếp */
    @IsOptional()
    @IsIn(['name', 'salary', 'createdAt', 'updatedAt'])
    sortBy?: 'name' | 'salary' | 'createdAt' | 'updatedAt' = 'createdAt';

    /** Thứ tự sắp xếp */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    /** Lọc theo cửa hàng */
    @IsOptional()
    @IsString()
    shop_id?: string;

    /** Lương tối thiểu */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minSalary?: number;

    /** Lương tối đa */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxSalary?: number;
}
