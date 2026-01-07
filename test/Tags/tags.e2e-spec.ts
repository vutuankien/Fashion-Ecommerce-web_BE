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
import { TokenService } from 'src/modules/auth/token.service';

/** Mô tả bộ test cho TagsController (Các trường hợp lỗi - Unhappy Cases) */
describe('TagsController (e2e) - Unhappy Cases', () => {
    /** Khai báo biến lưu giữ thực thể ứng dụng */
    let app_instance: INestApplication;

    let token_service:TokenService
    /**Khai báo admin token */
    let admin_token: string;

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

        token_service = app_instance.get<TokenService>(TokenService);

        /** Tạo token admin giả lập */
        admin_token = token_service.GenerateToken({
            user_id: 1,
            email: 'admin@test.com',
            role: 'admin',
        });
    });

    /** Đóng ứng dụng và giải phóng tài nguyên sau khi hoàn tất test */
    afterAll(async () => {
        /** Đóng kết nối ứng dụng */
        await app_instance.close();
    });

    /** Kiểm tra tính đúng đắn của dữ liệu đầu vào (Validation) */
    describe('Trường hợp dữ liệu không hợp lệ (400 Bad Request)', () => {
        /** Test case gửi dữ liệu thiếu trường bắt buộc */
        it('POST /tags - Phải trả về 400 khi thiếu trường bắt buộc', () => {
            /** Thực hiện request thiếu dữ liệu */
            return request(app_instance.getHttpServer())
                .post('/tags')
                .set('Authorization', `Bearer ${admin_token}`)
                .send({
                    /** Thiếu các trường bắt buộc */
                })
                /** Kỳ vọng mã trạng thái 400 từ ValidationPipe */
                .expect(400);
        });
    });

    /** Kiểm tra trường hợp truy xuất tài nguyên không tồn tại */
    describe('Trường hợp không tìm thấy dữ liệu (404 Not Found hoặc 500)', () => {
        /** Test case lấy thông tin tag với ID không có trong database */
        it('GET /tags/:id - Phải trả về lỗi khi ID không tồn tại', () => {
            /** Gửi request với ID giả định */
            return request(app_instance.getHttpServer())
                .get('/tags/nonexistent-tag-id-999')
                /** Kỳ vọng mã trạng thái 500 do service ném lỗi */
                .expect(404);
        });

        /** Test case cập nhật tag không tồn tại */
        it('PATCH /tags/:id - Phải trả về lỗi khi cập nhật tag không tồn tại', () => {
            /** Gửi request cập nhật với ID không tồn tại */
            return request(app_instance.getHttpServer())
                .patch('/tags/nonexistent-tag-id-999')
                .send({
                    name: 'Updated Tag'
                })
                /** Kỳ vọng mã trạng thái 500 */
                .expect(404);
        });

        /** Test case xóa tag không tồn tại */
        it('DELETE /tags/:id - Phải trả về lỗi khi xóa tag không tồn tại', () => {
            /** Gửi request xóa với ID không tồn tại */
            return request(app_instance.getHttpServer())
                .delete('/tags/nonexistent-tag-id-999')
                /** Kỳ vọng mã trạng thái 500 */
                .expect(404);
        });
    });
});
