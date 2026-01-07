import { PartialType } from '@nestjs/mapped-types';
import { CreateProductSearchDto } from './create-product-search.dto';

export class UpdateProductSearchDto extends PartialType(CreateProductSearchDto) {}
