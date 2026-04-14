/** Import các decorator từ NestJS */
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
/** Import InventoryService để xử lý nghiệp vụ tồn kho */
import { InventoryService } from './inventory.service';
/** Import CreateInventoryDto để định nghĩa dữ liệu tạo mới */
import { CreateInventoryDto } from './dto/create-inventory.dto';
/** Import UpdateInventoryDto để định nghĩa dữ liệu cập nhật */
import { UpdateInventoryDto } from './dto/update-inventory.dto';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from '@/helper/response.helper';

/** Định nghĩa Controller cho Inventory */
@Controller('inventory')
/** Lớp InventoryController */
export class InventoryController {
  /** Hàm khởi tạo với InventoryService */
  constructor(
    /** Inject InventoryService */
    private readonly INVENTORY_SERVICE: InventoryService
  ) {}

  /** Controller tạo mới inventory */
  @Post()
  /** Hàm xử lý tạo mới */
  async create(
    /** Nhận dữ liệu từ request body */
    @Body() create_inventory_dto: CreateInventoryDto
  ) {
    /** Thực hiện tạo mới qua service */
    const DATA = await this.INVENTORY_SERVICE.create(create_inventory_dto);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Create inventory successfully', 201);
  }

  /** Controller lấy danh sách inventory */
  @Get()
  /** Hàm xử lý lấy danh sách */
  async findAll(
    /** Nhận limit từ query */
    @Query("limit") limit?: number,
    /** Nhận page từ query */
    @Query("page") page?: number,
    /** Nhận search từ query */
    @Query('search') search?: string,
    /** Nhận sortBy từ query */
    @Query('sortBy') sortBy?: string,
    /** Nhận sortOrder từ query */
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    /** Nhận productId từ query */
    @Query('productId') productId?: string,
    /** Nhận warehouseId từ query */
    @Query('warehouseId') warehouseId?: string,
    /** Nhận shopId từ query */
    @Query('shopId') shopId?: string,
    /** Nhận status từ query */
    @Query('status') status?: string,
    /** Nhận minQuantity từ query */
    @Query('minQuantity') minQuantity?: number,
    /** Nhận maxQuantity từ query */
    @Query('maxQuantity') maxQuantity?: number
  ) {
    /** Lấy toàn bộ danh sách qua service */
    const DATA = await this.INVENTORY_SERVICE.findAll({ 
      limit, page, search, sortBy, sortOrder,
      productId, warehouseId, shopId, status: status as any,
      minQuantity, maxQuantity
    });
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Get all inventories successfully', 200);
  }

  /** Controller lấy inventory theo id */ 
  @Get(':id')
  /** Hàm xử lý lấy một inventory */
  async findOne(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    const DATA = await this.INVENTORY_SERVICE.findOne(id);
    return ResponseHelper.Success(DATA, 'Get inventory successfully', 200);
  }


  /** Controller cập nhật inventory */
  @Patch(':id')
  /** Hàm xử lý cập nhật */
  async update(
    /** Nhận id từ param */
    @Param('id') id: string,
    /** Nhận dữ liệu cập nhật từ body */
    @Body() update_inventory_dto: UpdateInventoryDto
  ) {
    const DATA = await this.INVENTORY_SERVICE.update(id, update_inventory_dto);
    return ResponseHelper.Success(DATA, 'Update inventory successfully', 200);
  }

  /** Controller xóa inventory */
  @Delete(':id')
  /** Hàm xử lý xóa */
  async remove(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    const DATA = await this.INVENTORY_SERVICE.remove(id);
    return ResponseHelper.Success(DATA, 'Delete inventory successfully', 200);
  }
}
