import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
/** Import TagsCache */
import { TagsCache } from './tags.cache';
/** Import RedisModule */
import { RedisModule } from 'src/config/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [TagsController],
  providers: [TagsService, PrismaService, TagsCache],
})
export class TagsModule {}
