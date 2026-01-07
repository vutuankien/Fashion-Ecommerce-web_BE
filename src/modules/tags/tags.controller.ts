/** Import các decorator từ NestJS */
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
/** Import TagsService để xử lý nghiệp vụ thẻ tag */
import { TagsService } from './tags.service';
/** Import CreateTagDto để định nghĩa dữ liệu tạo mới */
import { CreateTagDto } from './dto/create-tag.dto';
/** Import Roles decorator để phân quyền */
import { Roles } from '../auth/roles.decorator';
/** Import RolesGuard để bảo vệ route */
import { RolesGuard } from '../auth/roles.guard';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';

/** Định nghĩa Controller cho Tags */
@Controller('tags')
/** Sử dụng RolesGuard cho toàn bộ controller */
@UseGuards(RolesGuard)
/** Lớp TagsController */
export class TagsController {
  /** Hàm khởi tạo với TagsService */
  constructor(
    /** Inject TagsService */
    private readonly TAGS_SERVICE: TagsService
  ) {}

  /** Controller tạo mới tag */
  @Post()
  /** Chỉ admin mới được tạo tag */
  @Roles("admin")
  /** Hàm xử lý tạo mới */
  async create(
    /** Nhận dữ liệu từ request body */
    @Body() create_tag_dto: CreateTagDto
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện tạo mới qua service */
      const DATA = await this.TAGS_SERVICE.create(create_tag_dto);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Tạo tag thành công', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller lấy toàn bộ tag */
  @Get()
  /** Hàm xử lý lấy danh sách */
  async findAll() {
    /** Khối try để bắt lỗi */
    try {
      /** Lấy danh sách tag qua service */
      const DATA = await this.TAGS_SERVICE.getTags();
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Lấy danh sách tag thành công', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Controller lấy tag theo id */
  @Get(':id')
  /** Hàm xử lý lấy một tag */
  async findOne(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    const DATA = await this.TAGS_SERVICE.getById(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Lấy tag thành công', 200);
  }

  /** Controller xóa tag */
  @Delete(':id')
  /** Hàm xử lý xóa */
  async remove(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Thực hiện xóa qua service */
    const DATA = await this.TAGS_SERVICE.remove(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Xóa tag thành công', 200);
  }
}
     