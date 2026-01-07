import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './database/database.module';
// import { PrismaService } from './prisma/prisma.service'; // Removed, used via PrismaModule
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { RedisModule } from './config/redis.module';
import { AddressModule } from './modules/address/address.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TagsModule } from './modules/tags/tags.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProviderModule } from './modules/provider/provider.module';
import { ProductsModule } from './modules/products/products.module';
import { ShopModule } from './modules/shop/shop.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EmployerModule } from './modules/employer/employer.module';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProductSearchModule } from './modules/product-search/product-search.module';

@Module({
  imports: [
    RedisModule,
    UserModule,
    DatabaseModule,
    AuthModule,
    InventoryModule,
    WarehouseModule,
    AddressModule,
    ScheduleModule.forRoot(),
    TagsModule,
    CategoriesModule,
    ProviderModule,
    ProductsModule,
    ShopModule,
    PrismaModule,
    CloudinaryModule,
    EmployerModule,
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }),
    ProductSearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
