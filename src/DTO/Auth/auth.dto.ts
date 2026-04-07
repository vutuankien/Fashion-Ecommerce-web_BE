import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../User/user.dto';



/**Giao diện dữ liệu đăng ký */
export class IRegisterDto {
    /**Email người dùng */
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /**Tên người dùng */
    @IsNotEmpty()
    @IsString()
    name: string;

    /**Mật khẩu người dùng */
    @IsString()
    password: string;

    /**Phân quyền người dùng */
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole

    /**ID của cửa hàng (bắt buộc nếu role là employer) */
    @IsOptional()
    @IsString()
    shop_id?: string;
}

/**Giao diện dữ liệu đăng nhập */
export class ILoginDto {
    /**Email người dùng */
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /**Mật khẩu người dùng */
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    clerk_token?: string;

    @IsOptional()
    role?: UserRole;
}

/**Giao diện dữ liệu refresh token */
export class IRefreshTokenDto {
    /**Refresh token */
    refresh_token: string;
}

/**Giao diện dữ liệu quên mật khẩu */
export class IForgotPasswordDto {
    /**Email người dùng */
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

/**Giao diện dữ liệu đặt lại mật khẩu */
export class IResetPasswordDto {
    /**Token xác thực đặt lại mật khẩu */
    @IsString()
    @IsNotEmpty()
    token: string;

    /**Mật khẩu mới */
    @IsString()
    @MinLength(6)
    password: string;
}

