import { IsBoolean, IsDate, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { VoucherProvider, VoucherType, VoucherApplyType } from "@prisma/client";

export class UpdateVoucherDto {
    // thông tin cơ bản
    @IsString()
    @IsOptional()
    code?: string;
    // tên hiển thị của voucher
    @IsString()
    @IsOptional()
    name?: string;

    // Enum
    // Loại voucher: giảm giá tiền, giảm giá phần trăm, miễn phí vận chuyển
    @IsEnum(VoucherType)
    @IsOptional()
    type?: VoucherType;
    // Voucher áp dụng cho tất cả, sản phẩm cụ thể hoặc danh mục cụ thể
    @IsEnum(VoucherApplyType)
    @IsOptional()
    applyType?: VoucherApplyType
    //Người tạo ra voucher: shop hay admin
    @IsEnum(VoucherProvider)
    @IsOptional()
    provider?: VoucherProvider;



    @IsNumber()
    @IsOptional()
    value?: number;
    // chỉ áp dụng cho DISCOUNT_PERCENT
    @IsNumber()
    @IsOptional()
    maxValue?: number;
    // giá trị đơn hàng tối thiểu để áp dụng voucher
    @IsNumber()
    @IsOptional()
    minOrderValue?: number;
    // số lượng voucher có sẵn
    @IsNumber()
    @IsOptional()
    quantity?: number;
    // số lượng voucher đã được sử dụng (auto-set to 0, not needed in DTO)
    @IsNumber()
    @IsOptional()
    used?: number = 0;
    // giới hạn số lần sử dụng voucher cho mỗi người dùng
    @IsNumber()
    @IsOptional()
    usageLimitPerUser?: number;
    // số tiền giảm giá tối đa cho một đơn hàng, chỉ áp dụng cho DISCOUNT_PERCENT
    @IsNumber()
    @IsOptional()
    shippingDiscount?: number;

    //Trạng thái của voucher
    // trạng thái hoạt động của voucher
    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
    // voucher có công khai hay không, nếu false thì chỉ những người dùng được chỉ định mới có thể sử dụng
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean = true;

    // ngày bắt đầu hiệu lực của voucher
    @IsDateString()
    @IsOptional()
    startDate?: Date;
    // ngày kết thúc hiệu lực của voucher
    @IsDateString()
    @IsOptional()
    endDate?: Date;

}
