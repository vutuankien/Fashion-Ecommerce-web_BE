import { TokenService } from './token.service';
import { Prisma } from '@prisma/client';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
        const { email, name, password, role, shop_id } = register_dto;

        /** Kiểm tra shop_id nếu role là employer */
        if (role === 'employer' && !shop_id) {
            throw new BadRequestException('shop_id is required for employer registration');
        }

        /** Kiểm tra user đã tồn tại */
        const EXISTING_USER = await this.user_cache.checkExistsByEmail(email);
        if (EXISTING_USER) {
            throw new ConflictException('User already exists');
        }

        /** Hash password */
        const HASHED_PASSWORD = await PasswordService.HashPassword(password);

        /** Transaction */
        const RESULT = await this.prisma.$transaction(async (tx) => {
            /** Tạo user */
            const NEW_USER = await tx.user.create({
                data: {
                    email,
                    name,
                    password: HASHED_PASSWORD,
                    provider: 'email',
                    role: role || 'user',
                },
            });

            /** Nếu là shop thì tạo thêm shop */
            if (role === 'shop') {
                await tx.shop.create({
                    data: {
                        email,
                        name,
                        password: HASHED_PASSWORD,
                        userId: NEW_USER.id
                    },
                });
            }

            /** Nếu là employer thì tạo thêm employer */
            if (role === 'employer') {
                /** Kiểm tra shop_id có tồn tại không */
                if(!shop_id) throw new BadRequestException('shop_id is required');
                await tx.employer.create({
                    data: {
                        email,
                        name,
                        password: HASHED_PASSWORD,
                        userId: NEW_USER.id,
                        shop_id
                    },
                });
            }

            return NEW_USER;
        });

        /** Cache user */
        await this.user_cache.set(RESULT);

        return { NEW_USER: RESULT };
    }



    /**
     * Đăng nhập người dùng
     * @param login_dto - Thông tin đăng nhập
     */
    async Login(dto: ILoginDto) {
        /** Kiểm tra email và password có tồn tại không */
        if (!dto.email || !dto.password) {
            /** Ném lỗi BadRequest nếu thiếu email hoặc password */
            throw new BadRequestException('Missing email or password');
        }

        /** Tìm user trong database theo email */
        const user = await this.prisma.user.findUnique({
            /** Điều kiện tìm kiếm theo email */
            where: { email: dto.email },
        });

        /** Kiểm tra user có tồn tại và có password không */
        if (!user || !user.password) {
            /** Ném lỗi Unauthorized nếu thông tin đăng nhập không hợp lệ */
            throw new UnauthorizedException('Invalid credentials');
        }

        /** So sánh password người dùng nhập với password đã mã hóa trong database */
        const isValid = await PasswordService.ComparePassword(
            /** Password người dùng nhập */
            dto.password,
            /** Password đã mã hóa trong database */
            user.password,
        );

        /** Kiểm tra password có hợp lệ không */
        if (!isValid) {
            /** Ném lỗi Unauthorized nếu password không đúng */
            throw new UnauthorizedException('Invalid credentials');
        }

        /** Tạo refresh token mới cho user */
        const refreshToken = this.token_service.GenerateRefreshToken({
            /** ID của user */
            user_id: user.id,
            /** Role của user */
            role: user.role,
        });

        /** Mã hóa refresh token trước khi lưu */
        const hashedRefreshToken = await PasswordService.HashPassword(refreshToken);

        /** Cập nhật refresh token vào database theo role */
        switch (user.role) {
            case 'shop':
                /** Cập nhật refresh token cho shop */
                await this.prisma.shop.update({
                    where: { userId: user.id },
                    data: { refresh_token: hashedRefreshToken },
                });
                break;
            case 'employer':
                /** Cập nhật refresh token cho employer */
                await this.prisma.employer.update({
                    where: { userId: user.id },
                    data: { refresh_token: hashedRefreshToken },
                });
                break;
            default:
                /** Cập nhật refresh token cho user thường (user, admin, author) */
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { refresh_token: hashedRefreshToken },
                });
                break;
        }

        /** Trả về access token và refresh token */
        return {
            /** Tạo access token mới */
            access_token: this.token_service.GenerateToken({
                /** ID của user */
                user_id: user.id,
                /** Email của user */
                email: user.email,
                /** Role của user */
                role: user.role,
            }),
            /** Refresh token chưa mã hóa để trả về cho client */
            refresh_token: refreshToken,
        };
    }



    /**
     * Làm mới token
     * @param dto - Thông tin refresh token
     */
    async RefreshToken(dto: IRefreshTokenDto) {
        /**Nếu ko tồn tại refresh_token thì ném lỗi  */
        if (!dto.refresh_token) {
            throw new BadRequestException('refresh_token is required');
        }

        /**Tạo payload từ refresh_token */
        let payload: any;

        /**Try catch để bắt lỗi */
        try {
            /**Xác thực refresh_token */
            payload = this.jwt_service.verify(dto.refresh_token);
        } catch (err) {
            /**Nếu refresh_token không hợp lệ thì ném lỗi */
            throw new UnauthorizedException('Invalid refresh token');
        }

        /**Tìm user trong database */
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        /**Nếu không tìm thấy user hoặc không có refresh_token thì ném lỗi */
        if (!user || !user.refresh_token) {
            /**Nếu refresh_token không hợp lệ thì ném lỗi */
            throw new UnauthorizedException('Invalid refresh token');
        }

        /**So sánh refresh_token */
        const isValid = await PasswordService.ComparePassword(
            dto.refresh_token,
            user.refresh_token,
        );

        /**Nếu refresh_token không hợp lệ thì ném lỗi */
        if (!isValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        /**Tạo access_token */
        const access_token = this.token_service.GenerateToken({
            user_id: user.id,
            email: user.email,
            role: user.role,
        });

        /**Trả về access_token */
        return { access_token };
    }


    /**
     * Đăng xuất người dùng
     * @param user_id - ID của người dùng
     */
    async Logout(user_id: number) {

        const USER_IN_CACHE = await this.user_cache.get(user_id);

        if (!USER_IN_CACHE) {
            throw new NotFoundException('User not found');
        }


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
