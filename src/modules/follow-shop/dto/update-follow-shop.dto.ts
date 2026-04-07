import { PartialType } from '@nestjs/swagger';
import { CreateFollowShopDto } from './create-follow-shop.dto';

export class UpdateFollowShopDto extends PartialType(CreateFollowShopDto) {}
