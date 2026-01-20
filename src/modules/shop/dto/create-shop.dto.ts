import { IsString, IsOptional, IsNotEmpty, IsEmail, IsNumber } from "class-validator";

/**DTO để tạo dữ liệu cửa hàng mới */
export class CreateShopDto {
    /**ID của User liên kết với cửa hàng */
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    /**Tên của cửa hàng */
    @IsString()
    @IsNotEmpty()
    name: string;

    /**Số điện thoại cửa hàng */
    @IsString()
    @IsNotEmpty()
    phone: string;

    /**Email cửa hàng - Có thể để trống, mặc định là shop@gmail.com */
    @IsEmail()
    @IsOptional()
    email?: string;

    /**Mật khẩu đăng nhập - Có thể để trống, mặc định là 'shop' */
    @IsString()
    @IsOptional()
    password?: string;

    /**Token làm mới phiên đăng nhập */
    @IsOptional()
    @IsString()
    refresh_token?: string;

    /**Loại hình cung cấp (Vd: bán lẻ, bán buôn...) */
    @IsString()
    @IsNotEmpty()
    typeProvider: string;

    /**Mô tả chi tiết về cửa hàng */
    @IsString()
    @IsOptional()
    desc?: string;

    /**Đường dẫn ảnh đại diện */
    @IsString()
    @IsNotEmpty()
    avatar_url: string;

    /**Tên ngân hàng thụ hưởng */
    @IsString()
    @IsOptional()
    bank?: string;

    /**Tên chủ tài khoản ngân hàng */
    @IsString()
    @IsOptional()
    bank_account?: string;

    /**Số tài khoản ngân hàng */
    @IsString()
    @IsOptional()
    bank_number?: string;

    /**Địa chỉ cụ thể (Số nhà, đường...) */
    @IsString()
    @IsNotEmpty()
    address: string;

    /**ID của Tỉnh/Thành phố */
    @IsString()
    @IsNotEmpty()
    province_id: string;

    /**ID của Quận/Huyện */
    @IsString()
    @IsNotEmpty()
    district_id: string;

    /**ID của Xã/Phường */
    @IsString()
    @IsNotEmpty()
    commune_id: string;
}
