import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { RedisConnection } from './config/redis.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  /** khởi tạo ứng dụng NestJS */
  const APP = await NestFactory.create(AppModule);

  APP.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )
  /** xác định cổng lắng nghe */
  const PORT = process.env.PORT ?? 3000;

  /** khởi động ứng dụng */
  await APP.listen(PORT);
  /** thông báo khi ứng dụng đã khởi động */
  console.log(`NestJS server is running on http://localhost:${PORT}`);
  /** khởi tạo kết nối Redis */
  const REDIS_CONN = new RedisConnection();
  /** thực hiện kết nối */
  await REDIS_CONN.exec({});
}
bootstrap();
