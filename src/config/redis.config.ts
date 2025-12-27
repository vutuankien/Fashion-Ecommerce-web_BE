import { Redis } from 'ioredis';
import 'dotenv/config';

//#region RedisConnection - Thành phần kết nối Redis
// -----------------------------------------------------------------------------
/** giao diện định nghĩa cấu hình cho việc kết nối Redis */
export interface IConfigRedisConnection {
  /** địa chỉ máy chủ Redis */
  HOST?: string;
  /** cổng dịch vụ của Redis */
  PORT?: number;
  /** mật khẩu bảo mật của Redis */
  PASSWORD?: string;
  /** chỉ số cơ sở dữ liệu sẽ sử dụng */
  DB?: number;
}
/** giao diện định nghĩa bối cảnh đầu vào cho việc thực thi */
export interface IContextRedisConnection {
}
/** giao diện định nghĩa dữ liệu trả về sau khi thực thi */
export interface IResultRedisConnection {
  /** đối tượng điều khiển kết nối Redis */
  REDIS_CLIENT: Redis;
}
/** giao diện chuẩn cho lớp thực hiện kết nối Redis */
export interface IRedisConnection {
  /** phương thức thực hiện logic kết nối */
  exec(context: IContextRedisConnection): Promise<IResultRedisConnection>
}
/** lớp thực thi việc khởi tạo và quản lý kết nối Redis */
export class RedisConnection implements IRedisConnection {
  /** hàm khởi tạo để thiết lập các tham số ban đầu */
  constructor(
    /** cấu hình kết nối được truyền vào hoặc lấy từ môi trường */
    private readonly CONFIG: IConfigRedisConnection = {
      /** xác định địa chỉ host từ biến môi trường hoặc mặc định */
      HOST: process.env.REDIS_HOST || '127.0.0.1',
      /** xác định cổng kết nối từ biến môi trường hoặc mặc định */
      PORT: Number(process.env.REDIS_PORT) || 6379,
      /** xác định mật khẩu truy cập từ biến môi trường */
      PASSWORD: process.env.REDIS_PASSWORD || '',
      /** xác định cơ sở dữ liệu từ biến môi trường hoặc mặc định */
      DB: Number(process.env.REDIS_DB) || 0,
    },
  ) {}

  /** phương thức bất đồng bộ để thực hiện kết nối */
  async exec({}: IContextRedisConnection) {
    /** khai báo hằng số lưu trữ đối tượng kết nối mới */
    const REDIS_CLIENT = new Redis({
      /** gán giá trị host */
      host: this.CONFIG.HOST,
      /** gán giá trị port */
      port: this.CONFIG.PORT,
      /** gán giá trị password */
      password: this.CONFIG.PASSWORD,
      /** gán giá trị database */
      db: this.CONFIG.DB,
      /** ngăn chặn việc tự động kết nối để kiểm soát bằng lệnh connect() */
      lazyConnect: true,
    });

    /** thiết lập lắng nghe sự kiện lỗi kết nối */
    REDIS_CLIENT.on('error', (error) => {
      /** in thông báo lỗi kết nối ra màn hình */
      console.error('Lỗi kết nối Redis:', error.message);
    });

    /** thiết lập lắng nghe sự kiện kết nối thành công */
    REDIS_CLIENT.on('connect', () => {
      /** in thông báo kết nối thành công ra màn hình */
      console.log('Đang thiết lập kết nối tới Redis...');
    });

    try {
      /** thực hiện khởi động kết nối tới server */
      await REDIS_CLIENT.connect();
      /** gởi lệnh PING để kiểm tra phản hồi từ Redis */
      await REDIS_CLIENT.ping();
      /** in thông báo xác nhận kết nối hoạt động tốt */
      console.log('Xác nhận: Kết nối Redis đã sẵn sàng và hoạt động tốt.');
    } catch (error) {
      /** in thông báo khi không thể kết nối hoặc ping thất bại */
      console.error('Không thể kết nối tới Redis:', error instanceof Error ? error.message : error);
    }
    
    /** trả về đối tượng chứa kết nối đã thiết lập */
    return {
      /** thuộc tính chứa redis client */
      REDIS_CLIENT
    }
  }
}
// -----------------------------------------------------------------------------
//#endregion
