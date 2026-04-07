import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributeDto } from './create-attribute.dto';

/** DTO dùng để cập nhật Attribute (tất cả field đều optional) */
export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}
