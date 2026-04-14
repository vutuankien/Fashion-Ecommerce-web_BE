/** Import Injectable từ NestJS */
import { Injectable, NotFoundException } from '@nestjs/common';
/** Import CreateCategoryDto */
import { CreateCategoryDto } from './dto/create-category.dto';
/** Import UpdateCategoryDto */
import { UpdateCategoryDto } from './dto/update-category.dto';
/** Import PrismaService */
import { PrismaService } from '@/prisma/prisma.service';
/** Import CategoriesCache */
import { CategoriesCache } from './categories.cache';

/** Service quản lý danh mục */
@Injectable()
export class CategoriesService {
  /** Khởi tạo constructor */
  constructor(
    /** Inject PrismaService */
    private readonly PRISMA_SERVICE: PrismaService,
    /** Inject CategoriesCache */
    private readonly CATEGORIES_CACHE: CategoriesCache
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

    /** Invalidate cache sau khi tạo mới */
    await this.CATEGORIES_CACHE.invalidateAll();

    /** Trả về dữ liệu */
    return DATA;
  }

  /** Hàm lấy tất cả danh mục với pagination, search, sort */
  async findAll(query?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    /** Destructure và set default values */
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query || {};

    /** Validate và normalize limit */
    const MAX_LIMIT = Math.max(1, Math.min(limit, 100));
    /** Validate và normalize page */
    const CURRENT_PAGE = Math.max(page, 1);
    /** Tính offset */
    const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

    /** Build where clause cho search */
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    } : {};

    /** Đếm tổng số records */
    const TOTAL = await this.PRISMA_SERVICE.categories.count({ where });
    /** Tính tổng số trang */
    const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

    /** Lấy danh sách từ DB với pagination và sort */
    const DATA = await this.PRISMA_SERVICE.categories.findMany({
      where,
      take: MAX_LIMIT,
      skip: OFFSET,
      orderBy: { [sortBy]: sortOrder }
    });

    /** Nếu không tìm thấy dữ liệu */
    if (!DATA) throw new Error("Fetch all categories failed");

    /** Trả về dữ liệu với pagination info */
    return {
      data: DATA,
      total: TOTAL,
      page: CURRENT_PAGE,
      limit: MAX_LIMIT,
      totalPage: TOTAL_PAGE
    };
  }

  /** Hàm tìm danh mục theo id */
  async findOne(id: string) {
    /** Tìm danh mục từ cache hoặc DB */
    const DATA = await this.CATEGORIES_CACHE.get(id);

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

    /** Xóa cache của category này và invalidate list */
    await this.CATEGORIES_CACHE.delete(id);
    await this.CATEGORIES_CACHE.invalidateAll();

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

    /** Xóa cache của category này và invalidate list */
    await this.CATEGORIES_CACHE.delete(id);
    await this.CATEGORIES_CACHE.invalidateAll();

    /** Trả về dữ liệu */
    return DATA;
  }
}
