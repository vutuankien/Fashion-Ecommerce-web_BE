import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';



export class CreateCartDto {
  /** ID của session */
  @IsString()
  @IsOptional()
  sessionId?: string;


  /** Danh sách các sản phẩm trong giỏ hàng */
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items: CreateCartItemDto[];
}


export class CreateCartItemDto {
  /** Số lượng */
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productVariantId: string;

}
