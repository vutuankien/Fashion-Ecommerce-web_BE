/** Import class-validator */
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** Vai trò người dùng */
export enum UserRole {
    /** Người dùng thông thường */
    USER = 'user',
    /** Quản trị viên */
    ADMIN = 'admin',
    /** Tác giả */
    AUTHOR = 'author',
}

/** Giao diện dữ liệu tạo người dùng */
export class ICreateUserDto {
    /** Email người dùng */
    @IsEmail()
    /** Không được để trống */
    @IsNotEmpty()
    email: string;

    /** Tên người dùng */
    /** Không được để trống */
    @IsNotEmpty()
    /** Phải là chuỗi */
    @IsString()
    name: string;

    /** Tuổi người dùng */
    /** Phải là số */
    @IsNumber()
    /** Tối thiểu là 0 */
    @Min(0)
    age: number;

    /** Vai trò người dùng */
    /** Phải thuộc enum UserRole */
    @IsEnum(UserRole)
    role: UserRole;

    /** Đường dẫn ảnh đại diện */
    /** Phải là chuỗi */
    @IsString()
    /** Không bắt buộc */
    @IsOptional()
    avatar_url?: string;

    /** Mật khẩu người dùng */
    /** Phải là chuỗi */
    @IsString()
    /** Không bắt buộc */
    @IsOptional()
    password?: string;
    
    /** Địa chỉ người dùng */
    /** Phải là chuỗi */
    @IsString()
    /** Không bắt buộc */
    @IsOptional()
    address?: string;

    /** Số điện thoại người dùng */
    /** Phải là chuỗi */
    @IsString()
    /** Không bắt buộc */
    @IsOptional()
    phone?: string;

    /** Nhà cung cấp */
    /** Phải là chuỗi */
    @IsString()
    provider: string;
}

/** Giao diện tìm kiếm người dùng nâng cao */
export class ISearchUserDto {
    /** Tên người dùng */
    @IsString()
    @IsOptional()
    name?: string;

    /** Email người dùng */
    @IsOptional()
    email?: string;

    /** Vai trò người dùng */
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    /** Tuổi người dùng */
    @IsNumber()
    @Min(0)
    @IsOptional()
    age?: number;

    /** Địa chỉ người dùng */
    @IsString()
    @IsOptional()
    address?: string;

    /** Số điện thoại người dùng */
    @IsString()
    @IsOptional()
    phone?: string;

    /** Nhà cung cấp */
    @IsOptional()
    provider?: string;
}

/** Giao diện tìm kiếm linh hoạt với các trường và giá trị */
export class IDynamicSearchDto {
    /** Các trường cần tìm kiếm (ví dụ: "name,email,address") */
    /** Phải là chuỗi */
    @IsString()
    /** Không được để trống */
    @IsNotEmpty()
    fields: string;

    /** Giá trị cần tìm kiếm */
    /** Phải là chuỗi */
    @IsString()
    /** Không được để trống */
    @IsNotEmpty()
    value: string;

    /** Trang hiện tại */
    /** Không bắt buộc */
    @IsOptional()
    page?: number;

    /** Số lượng bản ghi trên mỗi trang */
    /** Không bắt buộc */
    @IsOptional()
    limit?: number;
}