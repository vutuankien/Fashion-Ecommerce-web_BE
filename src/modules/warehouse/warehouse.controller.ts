/** Import các decorator từ NestJS */
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
/** Import WarehouseService để xử lý nghiệp vụ kho hàng */
import { WarehouseService } from './warehouse.service';
/** Import CreateWarehouseDto để định nghĩa dữ liệu tạo mới */
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';

/** Định nghĩa Controller cho Warehouse */
@Controller('warehouse')
/** Lớp WarehouseController */
export class WarehouseController {
  /** Hàm khởi tạo với WarehouseService */
  constructor(
    /** Inject WarehouseService */
    private readonly WAREHOUSE_SERVICE: WarehouseService
  ) {}

  /** Controller tạo mới warehouse */
  @Post()
  /** Hàm xử lý tạo mới */
  async create(
    /** Nhận dữ liệu từ request body */
    @Body() create_warehouse_dto: CreateWarehouseDto
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Sử dụng warehouse service để tạo mới warehouse */
      const DATA = await this.WAREHOUSE_SERVICE.create(create_warehouse_dto);

      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Create warehouse successfully', 201);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller lấy tất cả warehouse */
  @Get()
  /** Hàm xử lý lấy danh sách */
  async findAll(
    /** Nhận limit từ query */
    @Query('limit') limit: number,
    /** Nhận page từ query */
    @Query('page') page: number
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Sử dụng warehouse service để lấy tất cả warehouse */
      const DATA = await this.WAREHOUSE_SERVICE.findAll(limit, page);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Get all warehouses successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller lấy warehouse theo id */
  @Get(':id')
  /** Hàm xử lý lấy một warehouse */
  async findOne(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Sử dụng warehouse service để lấy warehouse theo id */
      const DATA = await this.WAREHOUSE_SERVICE.findOne(id);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Get warehouse successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller cập nhật warehouse theo id */
  @Patch(':id')
  /** Hàm xử lý cập nhật */
  async update(
    /** Nhận id từ param */
    @Param('id') id: string,
    /** Nhận dữ liệu cập nhật từ body */
    @Body() update_warehouse_dto: CreateWarehouseDto
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Sử dụng warehouse service để cập nhật warehouse theo id */
      const DATA = await this.WAREHOUSE_SERVICE.update(id, update_warehouse_dto);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Update warehouse successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller xóa warehouse theo id */
  @Delete(':id')
  /** Hàm xử lý xóa */
  async remove(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Sử dụng warehouse service để xóa warehouse theo id */
      const DATA = await this.WAREHOUSE_SERVICE.remove(id);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Delete warehouse successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }
}
