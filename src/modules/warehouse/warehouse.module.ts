import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PrismaService } from '@/prisma/prisma.service';
import { WarehouseRepository } from './warehouse.repository';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService,PrismaService, WarehouseRepository],
})
export class WarehouseModule {}
