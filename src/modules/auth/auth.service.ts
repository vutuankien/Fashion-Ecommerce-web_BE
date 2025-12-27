import { TokenService } from './token.service';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ILoginDto, IRefreshTokenDto, IRegisterDto, IForgotPasswordDto, IResetPasswordDto } from 'src/DTO/Auth/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from './password.service';
import { JwtService } from '@nestjs/jwt';
import { UserCache } from '../user/user.cache';

/**Dịch vụ xác thực người dùng */
@Injectable()
export class AuthService {
    /**Khởi tạo contructor để dùng prisma và các services */
    constructor(
        private readonly prisma: PrismaService,
        private readonly token_service: TokenService,
        private readonly jwt_service: JwtService,
        private readonly user_cache: UserCache 
    ) {}

    /**
     * Đăng ký người dùng mới
     * @param register_dto - Thông tin đăng ký
     */
    async Register(register_dto: IRegisterDto) {
        /**Kiểm tra thông tin đăng ký */
        if (!register_dto.email || !register_dto.password || !register_dto.name)
            throw new ConflictException('Missing required fields');

        /**Mã hóa mật khẩu sử dụng bcrypt */
        const HASHED_PASSWORD = await PasswordService.HashPassword(register_dto.password);

        /**Kiểm tra User đã tồn tại hay chưa */
        const EXISTING_USER = await this.user_cache.checkExistsByEmail(register_dto.email);


        /**Nếu user đã tồn tại thì ném lỗi */
        if (EXISTING_USER) throw new ConflictException('User already exists');

        /**Tạo user mới trong database */
        const NEW_USER = await this.prisma.user.create({
            data: {
                email: register_dto.email,
                name: register_dto.name,
                password: HASHED_PASSWORD,
                provider: 'email',
                role : register_dto.role || 'user',
            },
        });

        await this.user_cache.set(NEW_USER);

        /**Trả về thông tin user mới */
        return { NEW_USER };
    }


    /**
     * Đăng nhập người dùng
     * @param login_dto - Thông tin đăng nhập
     */
    async Login(login_dto: ILoginDto) {
        /**Kiểm tra thông tin đăng nhập */
        if (!login_dto.email || !login_dto.password)
            throw new ConflictException('Missing required fields');

        /**Tìm user trong cache hoặc database */
        const EXISTIN_USER = await this.user_cache.getByEmail(login_dto.email);
        
        /**Nếu không tìm thấy user thì ném lỗi */
        if (!EXISTIN_USER) throw new UnauthorizedException('Unauthorized');

        /**Kiểm tra mật khẩu có tồn tại không */
        if (!EXISTIN_USER.password) throw new UnauthorizedException('Invalid user data');

        /**So sánh mật khẩu */
        const IS_PASSWORD_VALID = await PasswordService.ComparePassword(
            login_dto.password,
            EXISTIN_USER.password,
        );
        
        /**Nếu mật khẩu không đúng thì ném lỗi */
        if (!IS_PASSWORD_VALID) throw new UnauthorizedException('Password is incorrect');

        const REFRESH_TOKEN = this.token_service.GenerateRefreshToken({
            user_id: EXISTIN_USER.id,
            role: EXISTIN_USER.role,});

        /**Mã hóa refresh token trước khi lưu vào database */
        const HASHED_REFRESH_TOKEN = await PasswordService.HashPassword(REFRESH_TOKEN);

        /**Lưu refresh token đã mã hóa vào database */
        await this.prisma.user.update({
            where: { id: EXISTIN_USER.id },
            data: { refresh_token: HASHED_REFRESH_TOKEN },
        });
        



        /**Trả về access token và refresh token */
        return {
            access_token: this.token_service.GenerateToken({
                user_id: EXISTIN_USER.id,
                email: EXISTIN_USER.email,
                role: EXISTIN_USER.role,
            }),
            refresh_token: REFRESH_TOKEN,
        };
    }


    /**
     * Làm mới token
     * @param dto - Thông tin refresh token
     */
    async RefreshToken(dto: IRefreshTokenDto) {
        /**Xác thực refresh token */
        const payload = this.jwt_service.verify(dto.refresh_token);

        /**Tìm user trong database */
        const EXISTIN_USER = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        /**Nếu không tìm thấy user hoặc không có refresh token thì ném lỗi */
        if (!EXISTIN_USER || !EXISTIN_USER.refresh_token) throw new UnauthorizedException();

        /**Kiểm tra refresh token có hợp lệ không */
        const IS_VALID = await PasswordService.ComparePassword(
            dto.refresh_token,
            EXISTIN_USER.refresh_token,
        );

        /**Nếu refresh token không hợp lệ thì ném lỗi */
        if (!IS_VALID) throw new UnauthorizedException();

        /**Tạo access token mới */
        const NEW_ACCESS_TOKEN = this.token_service.GenerateToken({
            user_id: EXISTIN_USER.id,
            email: EXISTIN_USER.email,
            role: EXISTIN_USER.role,
        });


        /**Trả về access token mới */
        return { access_token: NEW_ACCESS_TOKEN };
    }

    /**
     * Đăng xuất người dùng
     * @param user_id - ID của người dùng
     */
    async Logout(user_id: number) {


        /**Xoá refresh token khỏi cache */
        await this.user_cache.delete(user_id);

        /**Xoá refresh token khỏi database */
        await this.prisma.user.update({
            where: { id: user_id },
            data: { refresh_token: null },
        });
    }

    /**
     * Quên mật khẩu - Tạo token đặt lại mật khẩu
     * @param dto - Email của người dùng
     */
    async ForgetPassword(dto: IForgotPasswordDto) {
        /**Tìm user trong database */
        const EXISTIN_USER = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        /**Nếu không tìm thấy user thì ném lỗi */
        if (!EXISTIN_USER) throw new UnauthorizedException('User not found');

        /**Tạo token reset password với thời hạn 1 giờ */
        const RESET_TOKEN = this.jwt_service.sign(
            { user_id: EXISTIN_USER.id, email: EXISTIN_USER.email },
            { expiresIn: '1h' }
        );

        /**TODO: Gửi email chứa link reset password với token */
        /**Link: http://your-domain.com/reset-password?token={RESET_TOKEN} */
        
        /**Trả về token để test (trong production nên chỉ gửi email) */
        return { 
            message: 'Reset password token has been sent to your email',
            reset_token: RESET_TOKEN 
        };
    }

    /**
     * Đặt lại mật khẩu
     * @param dto - Thông tin đặt lại mật khẩu
     */
    async ResetPassword(dto: IResetPasswordDto) {
        /**Kiểm tra thông tin đầu vào */
        if (!dto.token || !dto.password)
            throw new ConflictException('Missing required fields');

        /**Xác thực token reset password */
        let payload;
        try {
            payload = this.jwt_service.verify(dto.token);
        } catch (error) {
            /**Token không hợp lệ hoặc đã hết hạn */
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        /**Tìm user trong database */
        const EXISTING_USER = await this.prisma.user.findUnique({
            where: { id: payload.user_id },
        });

        /**Nếu không tìm thấy user thì ném lỗi */
        if (!EXISTING_USER) throw new UnauthorizedException('User not found');

        /**Mã hóa mật khẩu mới */
        const HASHED_PASSWORD = await PasswordService.HashPassword(dto.password);

        /**Cập nhật mật khẩu mới cho user */
        await this.prisma.user.update({
            where: { id: EXISTING_USER.id },
            data: { password: HASHED_PASSWORD },
        });

        /**Trả về kết quả thành công */
        return { message: 'Password has been reset successfully' };
    }

}
