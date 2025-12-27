/** Nhập khẩu các thành phần cần thiết từ NestJS */
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
/** Nhập khẩu Request, Response và NextFunction từ Express */
import { Request, Response, NextFunction } from 'express';
/** Nhập khẩu TokenService để xác thực JWT */
import { TokenService } from '../auth/token.service';

//#region AuthMiddleware - Trung gian xác thực người dùng
/** Lớp middleware xử lý kiểm tra Token trước khi vào Controller */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
    /** Hàm khởi tạo tiêm TokenService */
    constructor(
        /** Dịch vụ xử lý token */
        private readonly TOKEN_SERVICE: TokenService
    ) {}

    /** Phương thức thực thi chính của Middleware */
    async use(req: Request, res: Response, next: NextFunction) {
        /** Lấy chuỗi authorization từ tiêu đề HTTP */
        const AUTH_HEADER = req.headers.authorization;

        /** Kiểm tra xem header có tồn tại và bắt đầu bằng Bearer không */
        if (!AUTH_HEADER || !AUTH_HEADER.startsWith('Bearer ')) {
            /** Nếu không hợp lệ, ném lỗi không có quyền truy cập */
            throw new UnauthorizedException('Yêu cầu cung cấp Access Token hợp lệ');
        }

        /** Tách lấy phần token sau chữ Bearer */
        const TOKEN = AUTH_HEADER.split(' ')[1];

        try {
            /** Gọi dịch vụ để xác thực và giải mã nội dung token */
            const PAYLOAD = this.TOKEN_SERVICE.VerifyToken(TOKEN);
            
            /** Gán thông tin người dùng đã xác thực vào đối tượng request */
            /** Ép kiểu sang any vì request mặc định của Express không có thuộc tính user */
            (req as any).user = PAYLOAD;

            /** Chuyển tiếp sang middleware hoặc controller tiếp theo */
            next();
        } catch (error) {
            /** Nếu có lỗi trong quá trình xác thực (hết hạn, sai chữ ký) */
            throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
        }
    }
}
//#endregion
