import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantDto } from './create-variant.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateVariantDto {
    @IsOptional()
    @IsInt()
    price?:number
    @IsOptional()
    @IsInt()
    stock?:number
}
