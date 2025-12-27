import { IsArray, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProviderDto {
    @IsString()
    name :string;
    @IsString()
    phone :string;
    @IsString()
    @IsIn(["NPL","Sản phẩm","Nguyên phụ liệu"])
    typeProvider :string;
    @IsString()
    desc? :string;
    @IsArray()
    @IsString({each:true})
    images :string[];

    @IsString()
    @IsOptional()
    bank? :string ; // ngân hàng nào
    @IsString()
    @IsOptional()
    bank_account? :string ; //chủ tài khoản
    @IsString()
    @IsOptional()
    @MaxLength(16)
    bank_number? :string ; // số tài khoản
    @IsString()
    @IsOptional()
    address :string ; //full địa chỉ
    @IsString()
    province_id :string;
    @IsString()
    district_id :string;
    @IsString()
    commune_id :string;
}
