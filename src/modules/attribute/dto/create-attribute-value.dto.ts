import { IsOptional, IsString } from 'class-validator';

/** DTO nhận từ request body khi tạo AttributeValue (không bao gồm attributeId) */
export class CreateAttributeValueBodyDto {
    /** Mã định danh của value (ví dụ: "red", "xl") */
    @IsString()
    code: string;

    /** Nhãn hiển thị của value (ví dụ: "Đỏ", "XL") */
    @IsString()
    label: string;

}

/** DTO đầy đủ dùng nội bộ trong service (bao gồm cả attributeId từ URL param) */
export class CreateAttributeValueDto extends CreateAttributeValueBodyDto {
    /** ID của Attribute cha - được gán từ URL param, không validate trong body */
    @IsOptional()
    @IsString()
    attributeId: string;
}
