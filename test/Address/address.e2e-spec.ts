/** Import module Test và TestingModule từ @nestjs/testing */
import { Test, TestingModule } from '@nestjs/testing';
/** Import INestApplication và ValidationPipe từ @nestjs/common */
import { INestApplication, ValidationPipe } from '@nestjs/common';
/** Import supertest để gọi API */
import request from 'supertest';
/** Import AppModule để khởi tạo ứng dụng test */
import { AppModule } from './../../src/app.module';
/** Import RedisConnection để thực hiện mock kết nối Redis */
import { RedisConnection } from './../../src/config/redis.config';

/** Mô tả bộ test cho AddressController (Các trường hợp lỗi - Unhappy Cases) */
describe('AddressController (e2e) - Unhappy Cases', () => {
    /** Khai báo biến lưu giữ thực thể ứng dụng */
    let app_instance: INestApplication;

    /** Khởi tạo ứng dụng và các tài nguyên cần thiết trước khi chạy test */
    beforeAll(async () => {
        /** Tạo module fixture từ AppModule và override RedisConnection để tránh lỗi kết nối */
        const MODULE_FIXTURE: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        /** Ghi đè provider RedisConnection bằng một đối tượng mock */
        .overrideProvider(RedisConnection)
        .useValue({
            /** Giả lập phương thức exec trả về một client trống */
            exec: async () => ({
                REDIS_CLIENT: {
                    /** Giả lập hàm lắng nghe sự kiện */
                    on: () => {},
                    /** Giả lập hàm lấy dữ liệu */
                    get: async () => null,
                    /** Giả lập hàm lưu dữ liệu */
                    set: async () => 'OK',
                    /** Giả lập hàm xóa dữ liệu */
                    del: async () => 1,
                    /** Giả lập hàm kiểm tra kết nối */
                    ping: async () => 'PONG',
                    /** Giả lập hàm đóng kết nối */
                    quit: async () => 'OK',
                }
            })
        })
        .compile();

        /** Tạo instance của ứng dụng NestJS */
        app_instance = MODULE_FIXTURE.createNestApplication();
        /** Kích hoạt ValidationPipe để kiểm tra tính hợp lệ của DTO */
        app_instance.useGlobalPipes(new ValidationPipe());
        /** Khởi chạy ứng dụng */
        await app_instance.init();
    });

    /** Đóng ứng dụng và giải phóng tài nguyên sau khi hoàn tất test */
    afterAll(async () => {
        /** Đóng kết nối ứng dụng */
        await app_instance.close();
    });

    /** Kiểm tra tính đúng đắn của dữ liệu đầu vào (Validation) */
    // describe('Trường hợp dữ liệu không hợp lệ (400 Bad Request)', () => {
    //     /** Test case gửi dữ liệu thiếu trường bắt buộc */
    //     it('POST /address - Phải trả về 400 khi thiếu trường bắt buộc', () => {
    //         /** Thực hiện request thiếu dữ liệu */
    //         return request(app_instance.getHttpServer())
    //             .post('/address')
    //             .send({
    //                 /** Thiếu các trường bắt buộc */
    //             })
    //             /** Kỳ vọng mã trạng thái 400 từ ValidationPipe */
    //             .expect(400);
    //     });
    // });

    /** Kiểm tra trường hợp truy xuất tài nguyên không tồn tại */
    describe('Trường hợp không tìm thấy dữ liệu (404 Not Found hoặc 500)', () => {
        /** Test case lấy thông tin province với ID không có trong database */
        it('GET /address/provinces/:id - Phải trả về lỗi khi ID không tồn tại', () => {
            /** Gửi request với ID giả định */
            return request(app_instance.getHttpServer())
                .get('/address/provinces/nonexistent-province-id-999')
                /** Kỳ vọng mã trạng thái 500 do service ném lỗi */
                .expect(404);
        });

        /** Test case lấy thông tin district với ID không có trong database */
        it('GET /address/districts/:id - Phải trả về lỗi khi ID không tồn tại', () => {
            /** Gửi request với ID giả định */
            return request(app_instance.getHttpServer())
                .get('/address/districts/nonexistent-district-id-999')
                /** Kỳ vọng mã trạng thái 500 */
                .expect(404);
        });

        /** Test case lấy thông tin commune với ID không có trong database */
        it('GET /address/communes/:id - Phải trả về lỗi khi ID không tồn tại', () => {
            /** Gửi request với ID giả định */
            return request(app_instance.getHttpServer())
                .get('/address/communes/nonexistent-commune-id-999')
                /** Kỳ vọng mã trạng thái 500 */
                .expect(404);
        });
    });
});
