/** Import Injectable từ NestJS */
import { Injectable, UnauthorizedException } from '@nestjs/common';
/** Import JwtService để xử lý token */
import { JwtService } from '@nestjs/jwt';

/** Giao diện payload cho token */
export interface ITokenPayload {
    /** ID người dùng */
    user_id: number;
    /** Email người dùng */
    email: string;
    /** Vai trò người dùng */
    role: string;
}

/** Giao diện payload cho refresh token */
export interface IRefreshTokenPayload {
    /** ID người dùng */
    user_id: number;
    /** Vai trò người dùng */
    role: string;
}

/** Dịch vụ xử lý JWT token */
@Injectable()
/** Lớp TokenService để quản lý việc tạo và xác thực token */
export class TokenService {
    /** Khởi tạo JWT service thông qua constructor */
    constructor(
        /** Inject JwtService */
        private readonly jwt_service: JwtService
    ) {}

    /**
     * Tạo access token cho người dùng
     * @param payload - Thông tin người dùng cần mã hóa
     * @returns Chuỗi token đã được ký
     */
    GenerateToken(payload: ITokenPayload) {
        /** Ký token với các thông tin sub (id), email, role */
        return this.jwt_service.sign(
            {
                /** ID người dùng */
                sub: payload.user_id,
                /** Email */
                email: payload.email,
                /** Quyền */
                role: payload.role,
                /** Khóa bí mật */
                secrect: process.env.JWT_SECRET_KEY,
            },
            /** Thời hạn 1 ngày */
            { expiresIn: '1d' }
        );
    }

    /**
     * Xác thực token cơ bản
     * @param token - Chuỗi token cần kiểm tra
     * @returns Dữ liệu đã giải mã từ token
     */
    Verify(token: string) {
        /** Sử dụng JwtService để giải mã token */
        return this.jwt_service.verify(token);
    }

    /**
     * Tạo refresh token cho người dùng
     * @param payload - Thông tin id và role
     * @returns Chuỗi refresh token
     */
    GenerateRefreshToken(payload: IRefreshTokenPayload) {
        /** Ký refresh token với thời hạn lâu hơn */
        return this.jwt_service.sign(
            {
                /** ID người dùng */
                sub: payload.user_id,
                /** Quyền */
                role: payload.role,
                /** Khóa bí mật */
                secrect: process.env.JWT_SECRET_KEY,
            },
            /** Thời hạn 30 ngày */
            { expiresIn: '30d' }
        );
    }


    /**
     * Xác thực token và kiểm tra quyền admin
     * @param token - Chuỗi token
     * @returns Payload nếu hợp lệ và là admin
     */
    VerifyAdminToken(token: string) {
        /** Kiểm tra sự hiện diện của token */
        if (!token) throw new UnauthorizedException('Token is required');
        
        /** Giải mã token */
        const PAYLOAD = this.jwt_service.verify(token);
        
        /** Kiểm tra nếu không phải admin thì ném lỗi trực tiếp */
        if (PAYLOAD.role !== 'admin') throw new UnauthorizedException('Admin privileges required');
        
        /** Trả về dữ liệu đã giải mã */
        return PAYLOAD;
    }


    /**
     * Xác thực token tổng quát
     * @param token - Token từ header
     * @returns Thông tin giải mã từ token
     */
    VerifyToken(token: string) {
        /** Kiểm tra token có tồn tại không */
        if (!token) throw new UnauthorizedException('Token is required');
        
        /** Thử giải mã token bằng JwtService */
        try {
            /** Lưu kết quả giải mã vào biến PAYLOAD */
            const PAYLOAD = this.jwt_service.verify(token);
            
            /** Trả về nội dung token cho Controller sử dụng */
            return PAYLOAD;
        } catch (error) {
            /** Nếu token hết hạn hoặc không hợp lệ thì ném lỗi */
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

}