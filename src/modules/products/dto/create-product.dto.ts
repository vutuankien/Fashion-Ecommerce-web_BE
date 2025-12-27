/** Import các decorator validation từ class-validator */
import { IsArray, IsBoolean, IsNumber, IsObject, IsString, IsOptional } from "class-validator";

/** DTO định nghĩa dữ liệu để tạo mới sản phẩm */
export class CreateProductDto {
    /** Từ khóa tìm kiếm sản phẩm */
    @IsString()
    keyword: string;

    /** Tên sản phẩm */
    @IsString()
    name: string;

    /** Loại sản phẩm */
    @IsString()
    type: string;

    /** Mô tả sản phẩm */
    @IsString()
    @IsOptional()
    description?: string;

    /** Danh sách hình ảnh sản phẩm */
    @IsArray()
    @IsString({each: true})
    images: string[];

    /** Ghi chú sản phẩm */
    @IsString()
    @IsOptional()
    note?: string;

    /** Chất liệu sản phẩm */
    @IsArray()
    @IsString({each: true})
    material: string[];

    /** Khối lượng sản phẩm */
    @IsString()
    @IsOptional()
    weight?: string;

    /** Trạng thái xuất bản */
    @IsBoolean()
    @IsOptional()
    is_published?: boolean;

    /** Trạng thái ẩn */
    @IsBoolean()
    @IsOptional()
    is_hidden?: boolean;

    /** Thuộc tính động của sản phẩm (JSON) */
    @IsObject()
    @IsOptional()
    product_attributes?: object;

    /** Giá nhập cuối cùng */
    @IsNumber()
    @IsOptional()
    last_import_price?: number;

    /** Giá tại quầy */
    @IsNumber()
    price_at_counter: number;

    /** Giá bán lẻ */
    @IsNumber()
    retail_price: number;

    /** Giá khuyến mãi */
    @IsNumber()
    sale_price: number;

    /** Số lượng tồn kho */
    @IsNumber()
    stock: number;

    /** ID của kho hàng */
    @IsString()
    warehouse_id: string;

    /** Danh sách ID nhà cung cấp */
    @IsArray()
    @IsString({each: true})
    provider_id: string[];

    /** Danh sách ID danh mục */
    @IsArray()
    @IsString({each: true})
    category_ids: string[];

    /** Danh sách ID tag */
    @IsArray()
    @IsString({each: true})
    @IsOptional()
    tag_ids?: string[];
}
