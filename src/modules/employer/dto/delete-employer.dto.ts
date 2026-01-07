import { IsUUID } from "class-validator";

export class DeleteEmployerDto {
    /**ID nhân viên cần xóa */
    @IsUUID()
    id: string;
}