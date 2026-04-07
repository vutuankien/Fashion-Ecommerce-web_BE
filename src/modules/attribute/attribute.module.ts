import { Module } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { AttributeController } from './attribute.controller';

/** Module quản lý Attribute và AttributeValue */
@Module({
    controllers: [AttributeController],
    providers: [AttributeService],
    /** Export AttributeService để các module khác (ví dụ: VariantModule) có thể dùng */
    exports: [AttributeService],
})
export class AttributeModule {}
