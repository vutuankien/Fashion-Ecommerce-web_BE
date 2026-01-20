import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryDto, InventoryStatus } from './create-inventory.dto';

export class UpdateInventoryDto {
    
    /** số lượng */
    quantity: number;

    /** số lượng */
    review_quantity: number;
    /** trạng thái */
    status: InventoryStatus;
}
