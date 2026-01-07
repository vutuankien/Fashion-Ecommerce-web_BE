import { IsEmail, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from "class-validator";
import { Employer } from "../entities/employer.entity";


/** DTO tạo mới nhân viên */
export class CreateEmployerDto implements Employer {
    /** id của nhân viên */
    @IsUUID()
    @IsOptional()
    id?: string | undefined;

    /** địa chỉ của nhân viên */
    @IsString()
    @IsOptional()
    address?: string | undefined;

    /** mật khẩu đăng nhập */
    @IsString()
    password: string;

    /** token làm mới phiên đăng nhập */
    @IsOptional()
    @IsString()
    refresh_token?: string | undefined;

    /** mức lương của nhân viên */
    @IsOptional()
    @IsNumber()
    @Min(0)
    salary?: number | undefined;

    /** số điện thoại liên lạc */
    @IsOptional()
    @IsString()
    @Matches(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
    phone?: string | undefined;

    /** đường dẫn ảnh đại diện */
    @IsOptional()
    @IsString()
    avatar_url?: string | undefined;

    /** vai trò, mặc định là employer */
    @IsOptional()
    @IsString()
    role?: "employer";

    /** id của cửa hàng làm việc */
    @IsOptional()
    @IsUUID()
    shop_id?: string | undefined;

    /** email liên hệ */
    @IsString()
    @IsEmail()
    email: string;

    /** tên đầy đủ của nhân viên */
    @IsString()
    name: string;

    /** tuổi của nhân viên */
    @IsOptional()
    @IsNumber()
    @Min(0)
    age?: number;

}
