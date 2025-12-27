import { IsString } from "class-validator";

export class DeleteWarehouseDto {
    @IsString({ message: 'id must be a string' })
    id: string;
}