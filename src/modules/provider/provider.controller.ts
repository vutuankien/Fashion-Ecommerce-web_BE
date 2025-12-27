/** Import các decorator từ NestJS */
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
/** Import ProviderService để xử lý nghiệp vụ nhà cung cấp */
import { ProviderService } from './provider.service';
/** Import CreateProviderDto để định nghĩa dữ liệu tạo mới */
import { CreateProviderDto } from './dto/create-provider.dto';
/** Import UpdateProviderDto để định nghĩa dữ liệu cập nhật */
import { UpdateProviderDto } from './dto/update-provider.dto';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';

/** Định nghĩa Controller cho Provider */
@Controller('provider')
/** Lớp ProviderController */
export class ProviderController {
  /** Hàm khởi tạo với ProviderService */
  constructor(
    /** Inject ProviderService */
    private readonly PROVIDER_SERVICE: ProviderService
  ) {}

  /** Controller tạo mới provider */
  @Post()
  /** Hàm xử lý tạo mới */
  async create(
    /** Nhận dữ liệu từ request body */
    @Body() create_provider_dto: CreateProviderDto
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện tạo mới qua service */
      const RESPONSE = await this.PROVIDER_SERVICE.create(create_provider_dto);
      
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(RESPONSE,"Create provider successfully",201);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message,500);
    }
  }

  /** Controller lấy danh sách provider */
  @Get()
  /** Hàm xử lý lấy danh sách */
  async findAll() {
    /** Khối try để bắt lỗi */
    try {
      /** Lấy toàn bộ danh sách qua service */
      const RESPONSE = await this.PROVIDER_SERVICE.findAll();

      /** Trả về kết quả thành công */
      return ResponseHelper.Success(RESPONSE,"Get provider successfully",200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message,500);
    }
  }

  /** Controller lấy provider theo id */
  @Get(':id')
  /** Hàm xử lý lấy một provider */
  async findOne(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Lấy dữ liệu qua service */
      const RESPONSE = await this.PROVIDER_SERVICE.findOne(id);

      /** Trả về kết quả thành công */
      return ResponseHelper.Success(RESPONSE,"Get provider successfully",200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message,500);
    }
  }

  /** Controller cập nhật provider */
  @Patch(':id')
  /** Hàm xử lý cập nhật */
  async update(
    /** Nhận id từ param */
    @Param('id') id: string,
    /** Nhận dữ liệu cập nhật từ body */
    @Body() update_provider_dto: UpdateProviderDto
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện cập nhật qua service */
      const RESPONSE = await this.PROVIDER_SERVICE.update(id, update_provider_dto);

      /** Trả về kết quả thành công */
      return ResponseHelper.Success(RESPONSE,"Update provider successfully",200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message,500);
    }
  }

  /** Controller xóa provider */
  @Delete(':id')
  /** Hàm xử lý xóa */
  async remove(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện xóa qua service */
      const RESPONSE = await this.PROVIDER_SERVICE.remove(id);

      /** Trả về kết quả thành công */
      return ResponseHelper.Success(RESPONSE,"Delete provider successfully",200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message,500);
    }
  }
}
