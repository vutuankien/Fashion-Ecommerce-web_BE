/** Import các decorator từ NestJS */
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
/** Import InventoryService để xử lý nghiệp vụ tồn kho */
import { InventoryService } from './inventory.service';
/** Import CreateInventoryDto để định nghĩa dữ liệu tạo mới */
import { CreateInventoryDto } from './dto/create-inventory.dto';
/** Import UpdateInventoryDto để định nghĩa dữ liệu cập nhật */
import { UpdateInventoryDto } from './dto/update-inventory.dto';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';

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
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện tạo mới qua service */
      const DATA = await this.INVENTORY_SERVICE.create(create_inventory_dto);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Create inventory successfully', 201);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller lấy danh sách inventory */
  @Get()
  /** Hàm xử lý lấy danh sách */
  async findAll() {
    /** Khối try để bắt lỗi */
    try {
      /** Lấy toàn bộ danh sách qua service */
      const DATA = await this.INVENTORY_SERVICE.findAll();
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Get all inventories successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller lấy inventory theo id */
  @Get(':id')
  /** Hàm xử lý lấy một inventory */
  async findOne(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Lấy dữ liệu qua service, ép kiểu id sang number */
      const DATA = await this.INVENTORY_SERVICE.findOne(+id);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Get inventory successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
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
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện cập nhật qua service */
      const DATA = await this.INVENTORY_SERVICE.update(+id, update_inventory_dto);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Update inventory successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller xóa inventory */
  @Delete(':id')
  /** Hàm xử lý xóa */
  async remove(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện xóa qua service */
      const DATA = await this.INVENTORY_SERVICE.remove(+id);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Delete inventory successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }
}
