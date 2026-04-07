import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAttributeValueDto } from './create-attribute-value.dto';

/** DTO dùng để cập nhật AttributeValue (bỏ attributeId, chỉ update code và label) */
export class UpdateAttributeValueDto extends PartialType(
    OmitType(CreateAttributeValueDto, ['attributeId'] as const),
) {}
