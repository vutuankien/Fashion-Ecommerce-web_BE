import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

/** DTO tạo bình luận */
export class CreateCommentDto {
    /** Nội dung bình luận */
    @IsString()
    content: string;

    /** ID sản phẩm */
    @IsString()
    productId: string;

    /** ID người dùng */
    @IsInt()
    userId: number;

    /** Hình ảnh bình luận */
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];
}
