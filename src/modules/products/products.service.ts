import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepo } from './products.repo';
import { ProductsCache } from './products.cache';

@Injectable()
export class ProductsService {
  /** Khởi tạo service với Repo và Cache */
  constructor(
    private readonly productsRepo: ProductsRepo,
    private readonly productsCache: ProductsCache
  ) {}

  /** Tạo sản phẩm mới */
  async create(createProductDto: CreateProductDto) {
    /** Gọi repo để tạo sản phẩm (Repo đã xử lý check duplicate name) */
    const NEW_PRODUCT = await this.productsRepo.create(createProductDto);
    /** Lưu sản phẩm mới tạo vào cache */
    await this.productsCache.set(NEW_PRODUCT);
    /** Trả về sản phẩm mới */
    return NEW_PRODUCT;
  }

  /** Lấy danh sách sản phẩm với pagination, search, sort, filters */
  async findAll(query?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    type?: string;
    is_published?: boolean;
    warehouse_id?: string;
  }) {
    /** Destructure và set default values */
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      brand,
      type,
      is_published,
      warehouse_id
    } = query || {};

    /** Validate và normalize */
    const MAX_LIMIT = Math.max(1, Math.min(limit, 100));
    const CURRENT_PAGE = Math.max(page, 1);
    const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

    /** Build where clause với search và filters */
    const where: Record<string, unknown> = {};

    /** Search conditions - tìm kiếm theo name, keyword, brand */
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { keyword: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    /** Filter conditions */
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (type) where.type = type;
    if (is_published !== undefined) where.is_published = is_published;
    if (warehouse_id) where.warehouse_id = warehouse_id;

    /** Price range filter */
    if (minPrice !== undefined || maxPrice !== undefined) {
      const price_filter: Record<string, number> = {};
      if (minPrice !== undefined) price_filter.gte = minPrice;
      if (maxPrice !== undefined) price_filter.lte = maxPrice;
      where.sale_price = price_filter;
    }

    /** Đếm tổng số records */
    const TOTAL = await this.productsRepo.count(where);
    const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

    /** Lấy danh sách từ DB */
    const DATA = await this.productsRepo.findMany({
      where,
      take: MAX_LIMIT,
      skip: OFFSET,
      orderBy: { [sortBy]: sortOrder }
    });

    /** Lưu vào cache */
    if (DATA && DATA.length > 0) {
      await this.productsCache.setAll(DATA);
    }

    /** Trả về với pagination info */
    return {
      data: DATA,
      total: TOTAL,
      page: CURRENT_PAGE,
      limit: MAX_LIMIT,
      totalPage: TOTAL_PAGE
    };
  }

  /** Lấy chi tiết một sản phẩm */
  async findOne(id: string) {
    const CACHE_PRODUCT = await this.productsCache.get(id);
    if (CACHE_PRODUCT) return CACHE_PRODUCT;

    const PRODUCT = await this.productsRepo.findOne(id);
    if (!PRODUCT) {
      throw new NotFoundException('Product not found');
    }

    await this.productsCache.set(PRODUCT);
    return PRODUCT;
  }


  /** Cập nhật sản phẩm */
  async update(id: string, updateProductDto: UpdateProductDto) {

    const EXIST_IN_CACHE = await this.productsCache.get(id);
    if (!EXIST_IN_CACHE) {
      throw new NotFoundException('Product not found');
    }
    /** Cập nhật trong DB */
    const UPDATED_PRODUCT = await this.productsRepo.update(id, updateProductDto);
    /** Cập nhật lại cache */
    await this.productsCache.set(UPDATED_PRODUCT);
    return UPDATED_PRODUCT;
  }

  /** Xóa sản phẩm */
  async remove(id: string) {
    const EXIST = await this.productsRepo.findOne(id);
    if (!EXIST) {
      throw new NotFoundException('Product not found');
    }
    /** Xóa trong DB */
    const DELETED_PRODUCT = await this.productsRepo.remove(id);
    /** Xóa trong cache */
    await this.productsCache.delete(id);
    return DELETED_PRODUCT;
  }
}
