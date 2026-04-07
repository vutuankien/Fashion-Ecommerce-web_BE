// remove-cart-item.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveCartItemDto {
    @IsString()
    @IsNotEmpty()
    productVariantId: string;
}