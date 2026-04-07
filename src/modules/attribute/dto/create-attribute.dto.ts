import { IsString } from 'class-validator';

/** DTO dùng để tạo mới một Attribute */
export class CreateAttributeDto {
    /** Mã định danh duy nhất của attribute (ví dụ: "color", "size") */
    @IsString()
    code: string;

    /** Kiểu dữ liệu của attribute (ví dụ: "text", "color", "size") */
    @IsString()
    type: string;
}
