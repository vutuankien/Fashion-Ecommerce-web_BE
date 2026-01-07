/** Import các decorator từ NestJS */
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
/** Import CategoriesService để xử lý nghiệp vụ danh mục */
import { CategoriesService } from './categories.service';
/** Import CreateCategoryDto để định nghĩa dữ liệu tạo mới */
import { CreateCategoryDto } from './dto/create-category.dto';
/** Import UpdateCategoryDto để định nghĩa dữ liệu cập nhật */
import { UpdateCategoryDto } from './dto/update-category.dto';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';

/** Định nghĩa Controller cho Categories */
@Controller('categories')
/** Lớp CategoriesController */
export class CategoriesController {
  /** Hàm khởi tạo với CategoriesService */
  constructor(
    /** Inject CategoriesService */
    private readonly CATEGORIES_SERVICE: CategoriesService
  ) {}

  /** Controller tạo mới category */
  @Post()
  /** Hàm xử lý tạo mới */
  async create(
    /** Nhận dữ liệu từ request body */
    @Body() create_category_dto: CreateCategoryDto
  ) {
    const DATA = await this.CATEGORIES_SERVICE.create(create_category_dto);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Create category successfully', 201);
  }

  /** Controller lấy danh sách category */
  @Get()
  /** Hàm xử lý lấy danh sách */
  async findAll() {
    /** Khối try để bắt lỗi */
    const DATA = await this.CATEGORIES_SERVICE.findAll();
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Get all categories successfully', 200);
  }

  /** Controller lấy category theo id */
  @Get(':id')
  /** Hàm xử lý lấy một category */
  async findOne(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    const DATA = await this.CATEGORIES_SERVICE.findOne(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Get category successfully', 200);
  }

  /** Controller cập nhật category */
  @Patch(':id')
  /** Hàm xử lý cập nhật */
  async update(
    /** Nhận id từ param */
    @Param('id') id: string,
    /** Nhận dữ liệu cập nhật từ body */
    @Body() update_category_dto: UpdateCategoryDto
  ) {
    /** Khối try để bắt lỗi */
    const DATA = await this.CATEGORIES_SERVICE.update(id, update_category_dto);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Update category successfully', 200);
  }

  /** Controller xóa category */
  @Delete(':id')
  /** Hàm xử lý xóa */
  async remove(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    const DATA = await this.CATEGORIES_SERVICE.remove(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Delete category successfully', 200);
  }
}
