/** Import module Test và TestingModule từ @nestjs/testing */
import { Test, TestingModule } from '@nestjs/testing';
/** Import INestApplication và ValidationPipe từ @nestjs/common */
import { INestApplication, ValidationPipe } from '@nestjs/common';
/** Import supertest để gọi API */
import request from 'supertest';
/** Import AppModule để khởi tạo ứng dụng test */
import { AppModule } from './../../src/app.module';
/** Import TokenService để tạo token dùng cho việc test phân quyền */
import { TokenService } from './../../src/modules/auth/token.service';
/** Import RedisConnection để thực hiện mock kết nối Redis */
import { RedisConnection } from './../../src/config/redis.config';

/** Mô tả bộ test cho ProductsController (Các trường hợp lỗi - Unhappy Cases) */
describe('ProductsController (e2e) - Unhappy Cases', () => {
    /** Khai báo biến lưu giữ thực thể ứng dụng */
    let app_instance: INestApplication;
    /** Biến lưu trữ TokenService để tạo token test */
    let token_service: TokenService;
    /** Token dành cho quản trị viên */
    let admin_token: string;
    /** Token dành cho người dùng thông thường */
    let user_token: string;

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

        /** Truy xuất TokenService từ context của ứng dụng */
        token_service = app_instance.get<TokenService>(TokenService);

        /** Tạo token admin giả lập */
        admin_token = token_service.GenerateToken({
            user_id: 1,
            email: 'admin@test.com',
            role: 'admin',
        });

        /** Tạo token user giả lập */
        user_token = token_service.GenerateToken({
            user_id: 2,
            email: 'user@test.com',
            role: 'user',
        });
    });

    /** Đóng ứng dụng và giải phóng tài nguyên sau khi hoàn tất test */
    afterAll(async () => {
        /** Đóng kết nối ứng dụng */
        await app_instance.close();
    });

    /** Kiểm tra các trường hợp không có token xác thực */
    describe('Trường hợp không có Token (401 Unauthorized)', () => {
        /** Test case tạo product mà không có token */
        it('POST /products - Phải trả về 401 khi thiếu header authorization', () => {
            /** Thực hiện gọi API mà không set Authorization header */
            return request(app_instance.getHttpServer())
                .post('/products')
                .send({
                    name: 'Test Product',
                    price: 100000
                })
                /** Kỳ vọng mã trạng thái 401 */
                .expect(401);
        });
    });

    /** Kiểm tra các trường hợp token không hợp lệ */
    describe('Trường hợp Token không hợp lệ (401 Unauthorized)', () => {
        /** Test case sử dụng token sai định dạng */
        it('POST /products - Phải trả về 401 khi token không hợp lệ', () => {
            /** Gửi token rác */
            return request(app_instance.getHttpServer())
                .post('/products')
                .set('Authorization', 'Bearer invalid_token_here')
                .send({
                    name: 'Test Product',
                    price: 100000
                })
                /** Kỳ vọng mã trạng thái 401 */
                .expect(401);
        });
    });

    /** Kiểm tra việc phân quyền (Role-based access control) */
    describe('Trường hợp không đủ quyền hạn (401 Unauthorized)', () => {
        /** Test case user thường cố gắng tạo product */
        it('POST /products - Phải trả về 401 khi user thường cố gắng tạo sản phẩm', () => {
            /** Gửi request kèm token của user thường */
            return request(app_instance.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${user_token}`)
                .send({
                    name: 'Test Product',
                    price: 100000
                })
                /** Kỳ vọng mã trạng thái 401 do RolesGuard ném lỗi */
                .expect(401);
        });

        /** Test case user thường cố gắng cập nhật product */
        it('PATCH /products/:id - Phải trả về 401 khi user thường cố gắng cập nhật sản phẩm', () => {
            /** Gửi request kèm token của user thường */
            return request(app_instance.getHttpServer())
                .patch('/products/test-product-id')
                .set('Authorization', `Bearer ${user_token}`)
                .send({
                    name: 'Updated Product'
                })
                /** Kỳ vọng mã trạng thái 401 */
                .expect(401);
        });

        /** Test case user thường cố gắng xóa product */
        it('DELETE /products/:id - Phải trả về 401 khi user thường cố gắng xóa sản phẩm', () => {
            /** Gửi request kèm token của user thường */
            return request(app_instance.getHttpServer())
                .delete('/products/test-product-id')
                .set('Authorization', `Bearer ${user_token}`)
                /** Kỳ vọng mã trạng thái 401 */
                .expect(401);
        });
    });

    /** Kiểm tra tính đúng đắn của dữ liệu đầu vào (Validation) */
    describe('Trường hợp dữ liệu không hợp lệ (400 Bad Request)', () => {
        /** Test case gửi dữ liệu thiếu trường bắt buộc */
        it('POST /products - Phải trả về 400 khi thiếu trường bắt buộc', () => {
            /** Thực hiện request với role admin nhưng thiếu dữ liệu */
            return request(app_instance.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${admin_token}`)
                .send({
                    /** Thiếu các trường bắt buộc */
                })
                /** Kỳ vọng mã trạng thái 400 từ ValidationPipe */
                .expect(400);
        });
    });

    /** Kiểm tra trường hợp truy xuất tài nguyên không tồn tại */
    describe('Trường hợp không tìm thấy dữ liệu (404 Not Found)', () => {
        /** Test case lấy thông tin product với ID không có trong database */
        it('GET /products/:id - Phải trả về lỗi khi ID không tồn tại', () => {
            /** Gửi request với ID giả định */
            return request(app_instance.getHttpServer())
                .get('/products/nonexistent-product-id-999')
                .set('Authorization', `Bearer ${admin_token || user_token}`)
                /** Kỳ vọng mã trạng thái 404 */
                .expect(404);
        });

        /** Test case cập nhật product không tồn tại */
        it('PATCH /products/:id - Phải trả về lỗi khi cập nhật product không tồn tại', () => {
            /** Gửi request cập nhật với ID không tồn tại */
            return request(app_instance.getHttpServer())
                .patch('/products/nonexistent-product-id-999')
                .set('Authorization', `Bearer ${admin_token}`)
                .send({
                    name: 'Updated Product Name'
                })
                /** Kỳ vọng mã trạng thái 404 */
                .expect(404);
        });

        /** Test case xóa product không tồn tại */
        it('DELETE /products/:id - Phải trả về lỗi khi xóa product không tồn tại', () => {
            /** Gửi request xóa với ID không tồn tại */
            return request(app_instance.getHttpServer())
                .delete('/products/nonexistent-product-id-999')
                .set('Authorization', `Bearer ${admin_token}`)
                /** Kỳ vọng mã trạng thái 404 */
                .expect(404);
        });
    });
});
