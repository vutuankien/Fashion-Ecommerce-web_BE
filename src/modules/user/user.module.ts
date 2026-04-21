import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from '@/database/database.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { UserCache } from './user.cache';
import { UserRepository } from './user.repository';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, UserCache, UserRepository,CloudinaryService]
})
export class UserModule {}
 