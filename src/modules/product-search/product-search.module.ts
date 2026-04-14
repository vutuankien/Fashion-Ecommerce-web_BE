/**Import Module từ nestjs/common */
import { Module } from '@nestjs/common';
/**Import ProductSearchService */
import { ProductSearchService } from './product-search.service';
/**Import ProductSearchController */
import { ProductSearchController } from './product-search.controller';
/**Import ElasticsearchModule */
import { ElasticsearchModule } from '@nestjs/elasticsearch';
/** Import ProductSearchCache */
import { ProductSearchCache } from './product-search.cache';
/** Import RedisModule */
import { RedisModule } from '@/config/redis.module';

/**Module tìm kiếm sản phẩm */
@Module({
  controllers: [ProductSearchController],
  providers: [ProductSearchService, ProductSearchCache],
  imports: [
    /**Đăng ký ElasticsearchModule */
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }),
    /**Import RedisModule */
    RedisModule,
  ],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
