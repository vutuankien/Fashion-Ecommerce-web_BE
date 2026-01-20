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

/** Mô tả bộ test cho InventoryController */
describe('InventoryController (e2e)', () => {
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
        app_instance.useGlobalPipes(new ValidationPipe({ transform: true })); // Thêm transform: true để tự động chuyển đổi kiểu dữ liệu query params
        /** Khởi chạy ứng dụng */
        await app_instance.init();
    });

    /** Đóng ứng dụng và giải phóng tài nguyên sau khi hoàn tất test */
    afterAll(async () => {
        /** Đóng kết nối ứng dụng */
        await app_instance.close();
    });

    /** Kiểm tra tính đúng đắn của dữ liệu đầu vào (Validation) - Unhappy Cases */
    describe('Unhappy Cases - Dữ liệu không hợp lệ', () => {
        /** Test case gửi dữ liệu thiếu trường bắt buộc */
        it('POST /inventory - Phải trả về 400 khi thiếu trường bắt buộc', () => {
            /** Thực hiện request thiếu dữ liệu */
            return request(app_instance.getHttpServer())
                .post('/inventory')
                .send({
                    /** Thiếu các trường bắt buộc */
                })
                /** Kỳ vọng mã trạng thái 400 từ ValidationPipe */
                .expect(400);
        });
    });

    /** Kiểm tra trường hợp xử lý lỗi khi gọi service - Service Error Handling */
    describe('Unhappy Cases - Xử lý lỗi từ Service', () => {
        // Lưu ý: Controller hiện tại bắt lỗi và trả về ResponseHelper.Error
        // Do đó HTTP Status Code sẽ là 200 hoặc 201, nội dung body chứa thông báo lỗi.

        /** Test case lấy thông tin inventory với ID không có trong database */
        it('GET /inventory/:id - Phải trả về object lỗi khi ID không tồn tại', async () => {
            /** Gửi request với ID giả định */
            const response = await request(app_instance.getHttpServer())
                .get('/inventory/nonexistent-inventory-id-999')
                /** Kỳ vọng request thành công về mặt HTTP (do controller catch error) */
                .expect(404);
        });

        /** Test case cập nhật inventory không tồn tại */
        it('PATCH /inventory/:id - Phải trả về object lỗi khi cập nhật inventory không tồn tại', async () => {
            /** Gửi request cập nhật với ID không tồn tại */
            const response = await request(app_instance.getHttpServer())
                .patch('/inventory/nonexistent-inventory-id-999')
                .send({
                    quantity: 100
                })
                /** Kỳ vọng request thành công về mặt HTTP */
                .expect(404);
        });

        /** Test case xóa inventory không tồn tại */
        it('DELETE /inventory/:id - Phải trả về object lỗi khi xóa inventory không tồn tại', async () => {
            /** Gửi request xóa với ID không tồn tại */
            const response = await request(app_instance.getHttpServer())
                .delete('/inventory/nonexistent-inventory-id-999')
                /** Kỳ vọng request thành công về mặt HTTP */
                .expect(404);
        });
    });

    /** Kiểm tra Happy Functionality (nếu cần thiết hoặc để kiểm tra query params mới) */
    describe('Happy Cases - Chức năng hoạt động bình thường', () => {
      // Test cho findAll với query params
      it('GET /inventory - Phải lấy danh sách inventory với phân trang', () => {
        return request(app_instance.getHttpServer())
          .get('/inventory')
          .query({ limit: 10, page: 1 })
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toBeDefined();
            // Kiểm tra cấu trúc trả về theo ResponseHelper.Success
            expect(res.body.statusCode).toBe(200);
          });
      });
    });
});
