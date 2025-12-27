import { Module, Global } from '@nestjs/common';
import { RedisConnection } from './redis.config';

@Global()
@Module({
  providers: [RedisConnection],
  exports: [RedisConnection],
})
export class RedisModule {}
