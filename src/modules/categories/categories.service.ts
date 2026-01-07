/** Import Injectable từ NestJS */
import { Injectable, NotFoundException } from '@nestjs/common';
/** Import CreateCategoryDto */
import { CreateCategoryDto } from './dto/create-category.dto';
/** Import UpdateCategoryDto */
import { UpdateCategoryDto } from './dto/update-category.dto';
/** Import PrismaService */
import { PrismaService } from 'src/prisma/prisma.service';

/** Service quản lý danh mục */
@Injectable()
export class CategoriesService {
  /** Khởi tạo constructor */
  constructor(
    /** Inject PrismaService */
    private readonly PRISMA_SERVICE: PrismaService
  ) {}

  /** Hàm tạo mới danh mục */
  async create(create_category_dto: CreateCategoryDto) {
    /** Kiểm tra danh mục đã tồn tại chưa */
    const EXISTING_CATEGORY = await this.PRISMA_SERVICE.categories.findFirst({
      where: { name: create_category_dto.name }
    });

    /** Nếu đã tồn tại thì ném lỗi */
    if (EXISTING_CATEGORY) throw new Error("Category already exists");

    /** Tạo mới danh mục */
    const DATA = await this.PRISMA_SERVICE.categories.create({
      data: create_category_dto
    });

    /** Trả về dữ liệu */
    return DATA;
  }

  /** Hàm lấy tất cả danh mục */
  async findAll() {
    /** Lấy danh sách từ DB */
    const DATA = await this.PRISMA_SERVICE.categories.findMany();

    /** Nếu không tìm thấy dữ liệu */
    if (!DATA) throw new Error("Fetch all categories failed");

    /** Trả về dữ liệu */
    return DATA;
  }

  /** Hàm tìm danh mục theo id */
  async findOne(id: string) {
    /** Tìm danh mục theo id */
    const DATA = await this.PRISMA_SERVICE.categories.findUnique({
      where: { id }
    });

    /** Nếu không tìm thấy */
    if (!DATA) throw new NotFoundException("Category not found");

    /** Trả về dữ liệu */
    return DATA;
  }

  /** Hàm cập nhật danh mục */
  async update(id: string, update_category_dto: UpdateCategoryDto) {
    /** Kiểm tra xem danh mục có tồn tại không */
    const EXISTING_CATEGORY = await this.PRISMA_SERVICE.categories.findUnique({
      where: { id }
    });
    if (!EXISTING_CATEGORY) throw new NotFoundException("Category not found");

    /** Cập nhật danh mục */
    const DATA = await this.PRISMA_SERVICE.categories.update({
      where: { id },
      data: update_category_dto
    });

    /** Trả về dữ liệu */
    return DATA;
  }

  /** Hàm xóa danh mục */
  async remove(id: string) {
    /** Kiểm tra xem danh mục có tồn tại không */
    const EXISTING_CATEGORY = await this.PRISMA_SERVICE.categories.findUnique({
      where: { id }
    });
    if (!EXISTING_CATEGORY) throw new NotFoundException("Category not found");

    /** Xóa danh mục */
    const DATA = await this.PRISMA_SERVICE.categories.delete({
      where: { id }
    });

    /** Trả về dữ liệu */
    return DATA;
  }
}
