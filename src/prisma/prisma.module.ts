import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Module quản lý Prisma global */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
