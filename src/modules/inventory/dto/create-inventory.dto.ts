import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { InventoryStatus } from "@prisma/client";

export { InventoryStatus };

export class CreateInventoryDto {
    /**Product ID */
    @IsString()
    @IsNotEmpty()
    productId: string;

    /**Warehouse ID */
    @IsString()
    @IsNotEmpty()
    warehouseId: string;

    /**Shop ID */
    @IsString()
    @IsNotEmpty()
    shopId: string;

    /**Số lượng sẵn có trong kho hàng */
    @IsNumber()
    @IsNotEmpty()
    quantity: number;


    /**Trạng thái của kho hàng */
    @IsNotEmpty()
    @IsEnum(InventoryStatus)
    status: InventoryStatus;

    /**Số lượng đã được đặt hàng */
    @IsNumber()
    @IsNotEmpty()
    reservedQuantity: number;

    constructor() {
        this.status = InventoryStatus.ACTIVE;
        this.reservedQuantity = 0;
    }
}

