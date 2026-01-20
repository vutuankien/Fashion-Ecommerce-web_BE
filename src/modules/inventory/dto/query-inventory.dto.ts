/** Import class-validator decorators */
import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsNumber, IsEnum } from 'class-validator';
/** Import Type decorator */
import { Type } from 'class-transformer';
/** Import InventoryStatus enum */
import { InventoryStatus } from '@prisma/client';

/** DTO cho query parameters của inventory */
export class QueryInventoryDto {
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

    /** Từ khóa tìm kiếm theo tên sản phẩm */
    @IsOptional()
    @IsString()
    search?: string;

    /** Trường để sắp xếp */
    @IsOptional()
    @IsIn(['quantity', 'reservedQuantity', 'createdAt', 'updatedAt'])
    sortBy?: 'quantity' | 'reservedQuantity' | 'createdAt' | 'updatedAt' = 'createdAt';

    /** Thứ tự sắp xếp */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    /** Lọc theo sản phẩm */
    @IsOptional()
    @IsString()
    productId?: string;

    /** Lọc theo kho */
    @IsOptional()
    @IsString()
    warehouseId?: string;

    /** Lọc theo cửa hàng */
    @IsOptional()
    @IsString()
    shopId?: string;

    /** Lọc theo trạng thái */
    @IsOptional()
    @IsEnum(InventoryStatus)
    status?: InventoryStatus;

    /** Số lượng tối thiểu */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minQuantity?: number;

    /** Số lượng tối đa */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxQuantity?: number;
}
