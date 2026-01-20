/** import các decorator từ nestjs */
import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, Query, UseGuards } from '@nestjs/common';
/** import service employer */
import { EmployerService } from './employer.service';
/** import dto tạo employer */
import { CreateEmployerDto } from './dto/create-employer.dto';
/** import dto cập nhật employer */
import { UpdateEmployerDto } from './dto/update-employer.dto';
/** import helper phản hồi */
import { ResponseHelper } from 'src/helper/response.helper';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
@UseGuards(RolesGuard)
/** controller quản lý nhân viên */
@Controller('employer')
export class EmployerController {
  /**
   * khởi tạo controller
   * @param EMPLOYER_SERVICE 
   */
  constructor(private readonly EMPLOYER_SERVICE: EmployerService) {}

  /**
   * tạo mới nhân viên
   * @param createEmployerDto 
   * @param avatar 
   * @returns 
   */
  @Post()
  @Roles("admin")
  async create(@Body() createEmployerDto: CreateEmployerDto, @UploadedFile() avatar?: Express.Multer.File) {
    /** gọi service tạo mới */
    const DATA = await this.EMPLOYER_SERVICE.Create(createEmployerDto, avatar);
    /** trả về phản hồi thành công */
    return ResponseHelper.Success(DATA,"Create employer successfully",201);
  }

  /**
   * lấy danh sách nhân viên
   * @param query parameters
   * @returns 
   */
  @Get()
  @Roles("admin")
  async findAll(
    /** Nhận page từ query */
    @Query('page') page?: number,
    /** Nhận limit từ query */
    @Query('limit') limit?: number,
    /** Nhận search từ query */
    @Query('search') search?: string,
    /** Nhận sortBy từ query */
    @Query('sortBy') sortBy?: string,
    /** Nhận sortOrder từ query */
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    /** Nhận shop_id từ query */
    @Query('shop_id') shop_id?: string,
    /** Nhận minSalary từ query */
    @Query('minSalary') minSalary?: number,
    /** Nhận maxSalary từ query */
    @Query('maxSalary') maxSalary?: number
  ) {
    /** gọi service lấy danh sách */
    const DATA = await this.EMPLOYER_SERVICE.findAll({ 
      page, limit, search, sortBy, sortOrder, 
      shop_id, minSalary, maxSalary 
    });
    /** trả về phản hồi thành công */
    return ResponseHelper.Success(DATA,"Get all employer successfully",200);
  }

  /**
   * lấy chi tiết nhân viên
   * @param id 
   * @returns 
   */
  @Get(':id')
  @Roles("admin")
  async findOne(@Param('id') id: string) {
    /** gọi service tìm theo id */
    const DATA = await this.EMPLOYER_SERVICE.findOne(id);
    /** trả về phản hồi thành công */
    return ResponseHelper.Success(DATA,"Get employer successfully",200);
  }

  /**
   * cập nhật nhân viên
   * @param id 
   * @param updateEmployerDto 
   * @returns 
   */
  @Patch(':id')
  @Roles("admin")
  async update(@Param('id') id: string, @Body() updateEmployerDto: UpdateEmployerDto) {
    /** gọi service cập nhật */
    const DATA = await this.EMPLOYER_SERVICE.update(id, updateEmployerDto);
    /** trả về phản hồi thành công */
    return ResponseHelper.Success(DATA,"Update employer successfully",200);
  }

  /**
   * xóa nhân viên
   * @param id 
   * @returns 
   */
  @Delete(':id')
  @Roles("admin")
  async remove(@Param('id') id: string) {
    /** gọi service xóa */
    const DATA = await this.EMPLOYER_SERVICE.remove(id);
    /** trả về phản hồi thành công */
    return ResponseHelper.Success(DATA,"Delete employer successfully",200);
  }
}
