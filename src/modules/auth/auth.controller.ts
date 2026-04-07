/** Import các decorator từ NestJS */
import { Body, Controller, Post } from '@nestjs/common';
/** Import các DTO cho Auth */
import { IForgotPasswordDto, ILoginDto, IRegisterDto } from 'src/DTO/Auth/auth.dto';
/** Import AuthService để xử lý nghiệp vụ xác thực */
import { AuthService } from './auth.service';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';

/** Định nghĩa Controller cho Auth */
@Controller('auth')
/** Lớp AuthController */   
export class AuthController {
    /** Hàm khởi tạo với AuthService */
    constructor(
        /** Inject AuthService */
        private readonly AUTH_SERVICE: AuthService
    ) {}

    /**
     * Endpoint đăng ký người dùng mới
     * @param register_dto - Thông tin đăng ký
     */
    @Post('/register')
    /** Hàm xử lý đăng ký */
    async register(
        /** Nhận dữ liệu từ body */
        @Body() register_dto: IRegisterDto
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Kiểm tra các trường bắt buộc */
            if (!register_dto.email || !register_dto.password || !register_dto.name) {
                /** Trả về lỗi nếu thiếu thông tin */
                return ResponseHelper.Error('Missing required fields', 400);
            }

            /** Gọi Service đăng ký người dùng mới */
            const NEW_USER = await this.AUTH_SERVICE.Register(register_dto);

            /** Trả về Response gọi từ Response Helper */
            return ResponseHelper.Success(NEW_USER, 'User registered successfully', 201);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Trả về lỗi nếu có */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Hàm login cho người dùng
     * @param login_dto 
     * @returns 
     */
    @Post('login')
    /** Hàm xử lý đăng nhập */
    async login(
        /** Nhận dữ liệu từ body */
        @Body() login_dto: ILoginDto
    ) {
        /** Khối try để bắt lỗi */
        if (!login_dto.email || !login_dto.password) {
            /** Trả về lỗi nếu thiếu thông tin */
            return ResponseHelper.Error('Missing required fields', 400);
        }

        /** Thực hiện đăng nhập qua service */
        const LOGIN_RESPONSE = await this.AUTH_SERVICE.Login(login_dto);

        /** Trả về Response gọi từ Response Helper */
        /** Trả về Response gọi từ Response Helper */
        return ResponseHelper.Success(LOGIN_RESPONSE, 'User logged in successfully', 200);
    }

    /**
     * Đăng nhập bằng Clerk
     * @param token - Token từ Clerk
     */
    @Post('login-clerk')
    async loginWithClerk(@Body('token') token: string) {
        if (!token) {
            return ResponseHelper.Error('Token is required', 400);
        }

        const LOGIN_RESPONSE = await this.AUTH_SERVICE.loginWithClerk(token);
        return ResponseHelper.Success(LOGIN_RESPONSE, 'User logged in with Clerk successfully', 200);
    }

    /** Endpoint làm mới token */
    @Post('/refresh-token')
    /** Hàm xử lý làm mới token */
    async refreshToken(
        /** Nhận refresh_token từ body */
        @Body('refresh_token') refresh_token: string
    ) {
        /** Khối try để bắt lỗi */
        const REFRESH_RESPONSE = await this.AUTH_SERVICE.RefreshToken({ refresh_token: refresh_token });

        /** Trả về Response gọi từ Response Helper */
        return ResponseHelper.Success(REFRESH_RESPONSE, 'Token refreshed successfully', 200);
    }

    /** Endpoint quên mật khẩu */
    @Post('/forgot-password')
    async forgotPassword(
        @Body() dto: IForgotPasswordDto
    ) {
        const FORGOT_RESPONSE = await this.AUTH_SERVICE.ForgetPassword(dto);

        return ResponseHelper.Success(
            FORGOT_RESPONSE,
            'Password reset link sent successfully',
            200,
        );
    }


    /** Endpoint đăng xuất */
    @Post('/log-out')
    /** Hàm xử lý đăng xuất */
    async logOut(
        /** Nhận user_id từ body */
        @Body('user_id') user_id: number
    ) {
        /** Khối try để bắt lỗi */
        await this.AUTH_SERVICE.Logout(user_id);

        /** Trả về Response gọi từ Response Helper */
        return ResponseHelper.Success(null, 'User logged out successfully', 200);
    }
}
