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

  /** Lấy danh sách sản phẩm */
  async findAll(limit?: number, page?: number) {
    // Note: Removed cache getAll() check here because it returns random cached items
    // (scan results) which doesn't support correct pagination or full dataset retrieval.
    // We always go to DB for the list to ensure correct pagination meta.

    /** Nếu cache rỗng, lấy từ database (kết quả trả về chứa data và meta) */
    const result = await this.productsRepo.findAll(limit, page);
    
    /** Lưu danh sách lấy được vào cache */
    await this.productsCache.setAll(result.data);
    
    /** Trả về danh sách sản phẩm kèm metadata */
    return result;
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
