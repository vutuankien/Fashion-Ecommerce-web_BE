import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateWarehouseDto {
    @IsString({ message: 'Tên kho phải là chuỗi' })
    name: string;

    @IsString({ message: 'Địa chỉ phải là chuỗi' })
    address: string;

    @IsString({ message: 'Mã tỉnh thành phải là chuỗi' })
    province_id: string;

    @IsString({ message: 'Mã quận huyện phải là chuỗi' })
    district_id: string;

    @IsString({ message: 'Mã xã phường phải là chuỗi' })
    commune_id: string;

    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    phone: string;

    @IsBoolean({ message: 'Cho phép tạo đơn hàng phải là boolean' })
    @IsOptional()
    allow_create_order: boolean;
}
