/** Import các decorator và class cần thiết từ NestJS */
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
/** Import Reflector để đọc metadata từ decorator */
import { Reflector } from '@nestjs/core';
/** Import TokenService để verify token */
import { TokenService } from './token.service';
/** Import key metadata của roles */
import { ROLES_KEY } from './roles.decorator';
/** Import key metadata của public decorator */
import { IS_PUBLIC_KEY } from './public.decorator';


//#region RolesGuard - Guard kiểm tra quyền truy cập
/**
 * Guard tự động xác thực token và kiểm tra role
 * Sử dụng cùng với @Roles() decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
    /** Khởi tạo guard với các service cần thiết */
    constructor(
        /** Reflector để đọc metadata */
        private readonly reflector: Reflector,
        /** TokenService để verify token */
        private readonly tokenService: TokenService
    ) {}

    /**
     * Phương thức chính để kiểm tra quyền truy cập
     * @param context - ExecutionContext chứa thông tin request
     * @returns true nếu được phép, throw UnauthorizedException nếu không
     */
    canActivate(context: ExecutionContext): boolean {
        // Kiểm tra @Public() decorator trên method trước
        const IS_PUBLIC = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
        
        const REQUEST = context.switchToHttp().getRequest();
        const PATH = REQUEST.path;
        const METHOD = REQUEST.method;
        
        console.log(`[RolesGuard] ${METHOD} ${PATH} - IS_PUBLIC: ${IS_PUBLIC}`);

        /** Nếu là endpoint public, cho phép truy cập mà không cần kiểm tra token */
        if (IS_PUBLIC) {
            console.log(`[RolesGuard] Public endpoint, allowing access`);
            return true;
        }

        /** Lấy danh sách roles được phép từ decorator */
        const REQUIRED_ROLES = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

        /** Nếu không có yêu cầu role nào, cho phép truy cập */
        if (!REQUIRED_ROLES) {
            return true;
        }
        
        /** Lấy authorization header */
        const AUTH_HEADER = REQUEST.headers.authorization;

        /** Kiểm tra token có tồn tại */
        if (!AUTH_HEADER || !AUTH_HEADER.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token is required');
        }

        /** Trích xuất token */
        const TOKEN = AUTH_HEADER.replace('Bearer ', '');

        try {
            /** Verify token và lấy payload */
            const PAYLOAD = this.tokenService.VerifyToken(TOKEN);

            /** Gắn thông tin user vào request để sử dụng trong controller */
            REQUEST.user = PAYLOAD;

            /** Kiểm tra role của user có trong danh sách được phép không */
            const HAS_ROLE = REQUIRED_ROLES.includes(PAYLOAD.role);

            /** Nếu không có quyền */
            if (!HAS_ROLE) {
                throw new UnauthorizedException('Insufficient permissions');
            }

            /** Cho phép truy cập */
            return true;
        } catch (error) {
            /** Xử lý lỗi và ném UnauthorizedException */
            const errorMessage = error instanceof Error ? error.message : 'Invalid token';
            throw new UnauthorizedException(errorMessage);
        }
    }
}
//#endregion
