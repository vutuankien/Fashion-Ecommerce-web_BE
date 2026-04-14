import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { VoucherProductService } from './voucher-product.service';
import { VoucherCategoryService } from './voucher-category.service';
import { VoucherUsageService } from './voucher-usage.service';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService,VoucherProductService,VoucherCategoryService,VoucherUsageService],
  imports:[
    ElasticsearchModule.register({
      node:"http://localhost:9200"
    })
  ]
})
export class VoucherModule {}
