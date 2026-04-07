import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { RedisConnection } from './config/redis.config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  /** khởi tạo ứng dụng NestJS */
  const APP = await NestFactory.create(AppModule);

  /** Cấu hình Swagger */
  const config = new DocumentBuilder()
    .setTitle('Fashion API')
    .setDescription('API Documentation for Fashion Application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(APP, config);
  SwaggerModule.setup('api', APP, document);

  /** Cấu hình CORS để cho phép frontend truy cập */
  APP.enableCors({
    /** Cho phép origin từ frontend */
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    /** Cho phép credentials (cookies, authorization headers) */
    credentials: true,
    /** Các HTTP methods được phép */
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    /** Các headers được phép */
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-session-id'],
  });

  APP.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )
  /** xác định cổng lắng nghe */
  const PORT = process.env.PORT ?? 5000;

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
