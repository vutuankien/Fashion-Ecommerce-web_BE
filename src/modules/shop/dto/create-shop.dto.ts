import { IsString, IsOptional } from "class-validator";

export class CreateShopDto {
    @IsString()
    name: string;

    @IsString()
    phone: string;

    @IsString()
    typeProvider: string;

    @IsString()
    desc: string;

    @IsString()
    @IsOptional()
    avatar_url?: string;

    @IsString()
    bank: string;

    @IsString()
    bank_account: string;

    @IsString()
    bank_number: string;

    @IsString()
    address: string;

    @IsString()
    province_id: string;

    @IsString()
    district_id: string;

    @IsString()
    commune_id: string;


}
