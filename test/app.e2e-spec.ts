/** Import module Test và TestingModule từ @nestjs/testing */
import { Test, TestingModule } from '@nestjs/testing';
/** Import INestApplication từ @nestjs/common */
import { INestApplication } from '@nestjs/common';
/** Import supertest để gọi API */
import request from 'supertest';
/** Import AppModule để khởi tạo ứng dụng test */
import { AppModule } from './../src/app.module';

/** Mô tả bộ test cho AppController (e2e) */
describe('AppController (e2e)', () => {
  /** Khai báo biến ứng dụng */
  let app_instance: INestApplication;

  /** Chạy trước mỗi test case */
  beforeEach(async () => {
    /** Tạo module fixture từ AppModule */
    const MODULE_FIXTURE: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    /** Khởi tạo ứng dụng Nest từ fixture */
    app_instance = MODULE_FIXTURE.createNestApplication();
    /** Chờ ứng dụng khởi tạo xong */
    await app_instance.init();
  });

  /** Test case cho phương thức GET / */
  it('/ (GET)', () => {
    /** Gọi supertest tới root path */
    return request(app_instance.getHttpServer())
      .get('/')
      /** Mong đợi status code là 200 */
      .expect(200)
      /** Mong đợi nội dung trả về là JSON object */
      .expect({
        data: 'Hello World!',
        message: 'Get hello successfully',
        statusCode: 200
      });
  });
});

