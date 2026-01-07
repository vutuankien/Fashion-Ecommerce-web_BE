import { Module } from '@nestjs/common';
import { EmployerService } from './employer.service';
import { EmployerController } from './employer.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  imports:[AuthModule],
  controllers: [EmployerController],
  providers: [EmployerService,PrismaService,CloudinaryService],
})
export class EmployerModule {}
