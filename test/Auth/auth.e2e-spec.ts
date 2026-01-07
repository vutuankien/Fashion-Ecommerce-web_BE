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

/** Mô tả bộ test cho AuthController (Các trường hợp lỗi - Unhappy Cases) */
describe('AuthController (e2e) - Unhappy Cases', () => {
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

    /** Kiểm tra các trường hợp đăng ký thất bại */
    describe('POST /auth/register - Trường hợp lỗi khi đăng ký', () => {
        /** Test case thiếu trường bắt buộc */
        it('Phải trả về 400 khi thiếu email', () => {
            /** Gửi request thiếu email */
            return request(app_instance.getHttpServer())
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    password: 'Test123@',
                    role: 'user'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case email không hợp lệ */
        it('Phải trả về 400 khi email sai định dạng', () => {
            /** Gửi request với email không hợp lệ */
            return request(app_instance.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'invalid-email',
                    name: 'Test User',
                    password: 'Test123@',
                    role: 'user'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case thiếu tên */
        it('Phải trả về 400 khi thiếu name', () => {
            /** Gửi request thiếu name */
            return request(app_instance.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Test123@',
                    role: 'user'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case thiếu mật khẩu */
        it('Phải trả về 400 khi thiếu password', () => {
            /** Gửi request thiếu password */
            return request(app_instance.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'user'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });
    });

    /** Kiểm tra các trường hợp đăng nhập thất bại */
    describe('POST /auth/login - Trường hợp lỗi khi đăng nhập', () => {
        /** Test case thiếu email */
        it('Phải trả về 400 khi thiếu email', () => {
            /** Gửi request thiếu email */
            return request(app_instance.getHttpServer())
                .post('/auth/login')
                .send({
                    password: 'Test123@'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case thiếu password */
        it('Phải trả về 400 khi thiếu password', () => {
            /** Gửi request thiếu password */
            return request(app_instance.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case email không hợp lệ */
        it('Phải trả về 400 khi email sai định dạng', () => {
            /** Gửi request với email không hợp lệ */
            return request(app_instance.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'not-an-email',
                    password: 'Test123@'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case email không tồn tại */
        it('Phải trả về 500 khi email không tồn tại trong hệ thống', () => {
            /** Gửi request với email không tồn tại */
            return request(app_instance.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test123@'
                })
                /** Kỳ vọng mã trạng thái 401 do service ném lỗi */
                .expect(401);
        });
    });

    /** Kiểm tra các trường hợp refresh token thất bại */
    describe('POST /auth/refresh-token - Trường hợp lỗi khi làm mới token', () => {
        /** Test case token không hợp lệ */
        it('Phải trả về 500 khi refresh token không hợp lệ', () => {
            /** Gửi request với token không hợp lệ */
            return request(app_instance.getHttpServer())
                .post('/auth/refresh-token')
                .send({
                    refresh_token: 'invalid_token_here'
                })
                /** Kỳ vọng mã trạng thái 500 do JWT verify thất bại */
                .expect(401);
        });

        /** Test case thiếu refresh token */
        it('Phải trả về 500 khi thiếu refresh_token', () => {
            /** Gửi request thiếu refresh_token */
            return request(app_instance.getHttpServer())
                .post('/auth/refresh-token')
                .send({})
                /** Kỳ vọng mã trạng thái 500 */
                .expect(400);
        });

        /** Test case refresh token hết hạn */
        it('Phải trả về 401 khi refresh token hết hạn', () => {
            /** Gửi request với refresh token hết hạn */
            return request(app_instance.getHttpServer())
                .post('/auth/refresh-token')
                .send({ refresh_token: "expiredToken" })
                /** Kỳ vọng mã trạng thái 401 */
                .expect(401);
        });
    });

    /** Kiểm tra các trường hợp quên mật khẩu thất bại */
    describe('POST /auth/forgot-password - Trường hợp lỗi khi quên mật khẩu', () => {
        /** Test case thiếu email */
        it('Phải trả về 400 khi thiếu email', () => {
            /** Gửi request thiếu email */
            return request(app_instance.getHttpServer())
                .post('/auth/forgot-password')
                .send({})
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case email không hợp lệ */
        it('Phải trả về 400 khi email sai định dạng', () => {
            /** Gửi request với email không hợp lệ */
            return request(app_instance.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                    email: 'invalid-email'
                })
                /** Kỳ vọng mã trạng thái 400 */
                .expect(400);
        });

        /** Test case email không tồn tại */
        it('Phải trả về 401 khi email không tồn tại trong hệ thống', () => {
            /** Gửi request với email không tồn tại */
            return request(app_instance.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                    email: 'nonexistent@example.com'
                })
                /** Kỳ vọng mã trạng thái 401 */
                .expect(401);
        });
    });

    /** Kiểm tra các trường hợp đăng xuất thất bại */
    describe('POST /auth/log-out - Trường hợp lỗi khi đăng xuất', () => {
        /** Test case user không tồn tại */
        it('Phải trả về 404 khi user_id không tồn tại', () => {
            /** Gửi request với user_id không tồn tại */
            return request(app_instance.getHttpServer())
                .post('/auth/log-out')
                .send({
                    user_id: 999999
                })
                /** Kỳ vọng mã trạng thái 404 */
                .expect(404);
        });
    });
});
