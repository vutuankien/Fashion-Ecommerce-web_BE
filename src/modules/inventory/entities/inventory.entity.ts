import { InventoryStatus } from "@prisma/client";

export class Inventory {
    id: string;
    productId: string;
    warehouseId: string;
    shopId: string;
    quantity: number;
    reservedQuantity: number;
    status: InventoryStatus;
    createdAt: Date;
    updatedAt: Date;
}
