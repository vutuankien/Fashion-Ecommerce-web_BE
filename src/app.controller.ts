/** Import các decorator từ NestJS */
import { Controller, Get } from '@nestjs/common';
/** Import AppService để xử lý nghiệp vụ chung */
import { AppService } from './app.service';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from './helper/response.helper';

/** Định nghĩa Controller chính cho ứng dụng */
@Controller()
/** Lớp AppController */
export class AppController {
  /** Hàm khởi tạo với AppService */
  constructor(
    /** Inject AppService */
    private readonly APP_SERVICE: AppService
  ) {}

  /** Controller mặc định trả về lời chào */
  @Get()
  /** Hàm xử lý lấy lời chào */
  getHello() {
    /** Khối try để bắt lỗi */
    try {
      /** Lấy dữ liệu từ service */
      const DATA = this.APP_SERVICE.getHello();
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Get hello successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }
}
