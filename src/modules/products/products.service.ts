import { Injectable } from '@nestjs/common';
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
  async findAll() {
    /** Lấy tất cả sản phẩm từ cache */
    const ALL_PRODUCTS = await this.productsCache.getAll();
    
    /** Nếu có dữ liệu trong cache (mảng không rỗng) */
    if (ALL_PRODUCTS && ALL_PRODUCTS.length > 0) {
      return ALL_PRODUCTS;
    }

    /** Nếu cache rỗng, lấy từ database (kết quả trả về chứa data và meta) */
    const { data } = await this.productsRepo.findAll();
    
    /** Lưu danh sách lấy được vào cache */
    await this.productsCache.setAll(data);
    
    /** Trả về danh sách sản phẩm */
    return data;
  }

  /** Lấy chi tiết một sản phẩm */
  async findOne(id: string) {
    /** Tìm sản phẩm trong cache */
    const PRODUCT = await this.productsCache.get(id);
    
    /** Nếu tìm thấy, trả về ngay */
    if (PRODUCT) {
      return PRODUCT;
    }

    /** Nếu không thấy trong cache, tìm trong DB */
    const NEW_PRODUCT = await this.productsRepo.findOne(id);
    
    /** Lưu sản phẩm tìm được vào cache */
    await this.productsCache.set(NEW_PRODUCT);
    
    /** Trả về sản phẩm */
    return NEW_PRODUCT;
  }

  /** Cập nhật sản phẩm */
  async update(id: string, updateProductDto: UpdateProductDto) {
    /** Cập nhật trong DB */
    const UPDATED_PRODUCT = await this.productsRepo.update(id, updateProductDto);
    /** Cập nhật lại cache */
    await this.productsCache.set(UPDATED_PRODUCT);
    return UPDATED_PRODUCT;
  }

  /** Xóa sản phẩm */
  async remove(id: string) {
    /** Xóa trong DB */
    const DELETED_PRODUCT = await this.productsRepo.remove(id);
    /** Xóa trong cache */
    await this.productsCache.delete(id);
    return DELETED_PRODUCT;
  }
}
