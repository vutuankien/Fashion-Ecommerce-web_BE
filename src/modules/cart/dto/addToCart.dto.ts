// add-to-cart.dto.ts
import { IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';

export class AddToCartDto {
    @IsString()
    @IsNotEmpty()
    productVariantId: string;

    @IsInt()
    @Min(1)
    @Max(100) // tránh spam
    quantity: number;
}