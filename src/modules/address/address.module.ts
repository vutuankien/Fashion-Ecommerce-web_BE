import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  imports:[
    HttpModule.register({
      timeout:500,
      maxRedirects:5,
    })
  ],
  controllers: [AddressController],
  providers: [AddressService, PrismaService],
})
export class AddressModule {}
