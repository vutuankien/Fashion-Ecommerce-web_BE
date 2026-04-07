import { IsArray, IsInt, IsString } from "class-validator";

/** DTO để tạo mới một ProductVariant */
export class CreateVariantDto {
    /** Mã SKU duy nhất của variant */
    @IsString()
    sku: string;

    /** Giá của variant */
    @IsInt()
    price: number;

    /** Số lượng tồn kho */
    @IsInt()
    stock: number;



    /** Danh sách ID của AttributeValue (liên kết qua VariantAttribute) */
    @IsArray()
    @IsString({ each: true })
    attributeValueIds: string[];
}
