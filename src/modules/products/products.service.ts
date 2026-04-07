import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepo } from './products.repo';
import { ProductsCache } from './products.cache';

@Injectable()
export class ProductsService {
  /** Khởi tạo service với Repo và Cache */
  constructor(
    /** Kho lưu trữ sản phẩm */
    private readonly PRODUCTS_REPO: ProductsRepo,
    /** Bộ nhớ đệm sản phẩm */
    private readonly PRODUCTS_CACHE: ProductsCache
  ) {}

  /** Tạo sản phẩm mới */
  async Create(create_product_dto: CreateProductDto) {
    /** Gọi repo để tạo sản phẩm (Repo đã xử lý check duplicate name) */
    const NEW_PRODUCT = await this.PRODUCTS_REPO.create(create_product_dto);
    /** Lưu sản phẩm mới tạo vào cache */
    await this.PRODUCTS_CACHE.Set(NEW_PRODUCT);
    /** Trả về sản phẩm mới */
    return NEW_PRODUCT;
  }

  /** Lấy danh sách sản phẩm với pagination, search, sort, filters */
  async FindAll(query?: { 
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
    /** Destructure và set default values cho query */
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

    /** Giới hạn số lượng bản ghi trên một trang */
    const MAX_LIMIT = Math.max(1, Math.min(limit, 100));
    /** Xác định trang hiện tại */
    const CURRENT_PAGE = Math.max(page, 1);
    /** Tính toán vị trí bắt đầu lấy dữ liệu */
    const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

    /** Khởi tạo điều kiện lọc dữ liệu */
    const where: Record<string, unknown> = {};

    /** Nếu có từ khóa tìm kiếm, lọc theo tên, từ khóa hoặc thương hiệu */
    if (search) where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { keyword: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];

    /** Lọc theo thương hiệu nếu được cung cấp */
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    /** Lọc theo loại sản phẩm nếu được cung cấp */
    if (type) where.type = type;
    /** Lọc theo trạng thái hiển thị nếu được cung cấp */
    if (is_published !== undefined) where.is_published = is_published;
    /** Lọc theo kho hàng nếu được cung cấp */
    if (warehouse_id) where.warehouse_id = warehouse_id;

    /** Lọc theo khoảng giá nếu có minPrice hoặc maxPrice */
    if (minPrice !== undefined || maxPrice !== undefined) {
      /** Khởi tạo đối tượng lọc giá */
      const price_filter: Record<string, number> = {};
      /** Thiết lập giá tối thiểu */
      if (minPrice !== undefined) price_filter.gte = minPrice;
      /** Thiết lập giá tối đa */
      if (maxPrice !== undefined) price_filter.lte = maxPrice;
      /** Gán vào điều kiện lọc chính */
      where.sale_price = price_filter;
    }

    /** Đếm tổng số lượng sản phẩm thỏa mãn điều kiện */
    const TOTAL = await this.PRODUCTS_REPO.count(where);
    /** Tính toán tổng số trang dựa trên quy mô bản ghi */
    const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

    /** Truy vấn danh sách sản phẩm từ database qua repo */
    const DATA = await this.PRODUCTS_REPO.findMany({
      where,
      take: MAX_LIMIT,
      skip: OFFSET,
      orderBy: { [sortBy]: sortOrder }
    });

    /** Lưu danh sách sản phẩm tìm thấy vào cache để tăng tốc truy xuất sau */
    if (DATA && DATA.length > 0) await this.PRODUCTS_CACHE.SetAll(DATA);

    /** Trả về kết quả kèm thông tin phân trang */
    return {
      data: DATA,
      total: TOTAL,
      page: CURRENT_PAGE,
      limit: MAX_LIMIT,
      totalPage: TOTAL_PAGE
    };
  }

  /** Lấy chi tiết một sản phẩm */
  async FindOne(id: string) {
    /** Kiểm tra xem sản phẩm có trong cache không */
    const CACHE_PRODUCT = await this.PRODUCTS_CACHE.Get(id);
    /** Nếu tìm thấy trong cache thì trả về ngay lập tức */
    if (CACHE_PRODUCT) return CACHE_PRODUCT;

    /** Nếu không có trong cache, truy vấn từ database */
    const PRODUCT = await this.PRODUCTS_REPO.findOne(id);
    /** Ném lỗi nếu không tìm thấy bản ghi nào */
    if (!PRODUCT) throw new NotFoundException('Sản phẩm không tồn tại');

    /** Lưu sản phẩm vừa tìm được vào cache cho lần sau */
    await this.PRODUCTS_CACHE.Set(PRODUCT);
    /** Trả về thông tin sản phẩm */
    return PRODUCT;
  }


  /** Cập nhật sản phẩm */
  async Update(id: string, update_product_dto: UpdateProductDto) {
    /** Kiểm tra sự tồn tại của sản phẩm trước khi cập nhật */
    const EXIST_IN_CACHE = await this.PRODUCTS_CACHE.Get(id);
    /** Nếu không tồn tại thì ném lỗi */
    if (!EXIST_IN_CACHE) throw new NotFoundException('Sản phẩm không tồn tại');
    /** Cập nhật thông tin trong database thông qua repo */
    const UPDATED_PRODUCT = await this.PRODUCTS_REPO.update(id, update_product_dto);
    /** Cập nhật lại thông tin mới vào bộ nhớ đệm */
    await this.PRODUCTS_CACHE.Set(UPDATED_PRODUCT);
    /** Trả về kết quả sau cập nhật */
    return UPDATED_PRODUCT;
  }

  /** Xóa sản phẩm */
  async Remove(id: string) {
    /** Tìm sản phẩm để đảm bảo nó tồn tại trước khi xóa */
    const EXIST = await this.PRODUCTS_REPO.findOne(id);
    /** Ném lỗi nếu không tìm thấy */
    if (!EXIST) throw new NotFoundException('Sản phẩm không tồn tại');
    /** Thực hiện lệnh xóa trong database */
    const DELETED_PRODUCT = await this.PRODUCTS_REPO.remove(id);
    /** Xóa bỏ thông tin sản phẩm khỏi bộ nhớ đệm */
    await this.PRODUCTS_CACHE.Delete(id);
    /** Cập nhật cache của shop liên quan */
    await this.PRODUCTS_CACHE.DeleteByShop((DELETED_PRODUCT as any).shop_id);
    /** Trả về bản ghi đã xóa */
    return DELETED_PRODUCT;
  }

  /** Lấy tất cả sản phẩm của một shop */
  async GetAllProductByShopId(shop_id: string) {
    /** Gọi cache để lấy danh sách sản phẩm của shop */
    const CACHE_PRODUCTS = await this.PRODUCTS_CACHE.GetAllByShopId(shop_id);
    /** Nếu có dữ liệu trong cache thì trả về luôn */
    if (CACHE_PRODUCTS && CACHE_PRODUCTS.length > 0) return CACHE_PRODUCTS;

    /** Nếu cache miss, lấy từ DB thông qua repo */
    const PRODUCTS = await this.PRODUCTS_REPO.findMany({
      where: { shop_id }
    });
    /** Lưu toàn bộ sản phẩm tìm thấy vào cache đơn lẻ */
    await this.PRODUCTS_CACHE.SetAll(PRODUCTS);
    /** Trả về danh sách sản phẩm */
    return PRODUCTS;
  }

  /** Lấy chi tiết một sản phẩm thuộc sở hữu của shop */
  async GetProductByShopId(shop_id: string, product_id: string) {
    /** Lấy thông tin sản phẩm từ cache hoặc repo */
    const PRODUCT = await this.FindOne(product_id);
    
    /** Kiểm tra xem sản phẩm có thuộc shop này không */
    if ((PRODUCT as any).shop_id !== shop_id) throw new NotFoundException('Sản phẩm không thuộc cửa hàng này');
    
    /** Trả về thông tin sản phẩm */
    return PRODUCT;
  }

  /** Xóa một sản phẩm cụ thể của shop */
  async RemoveProductByShopId(shop_id: string, product_id: string) {
    /** Kiểm tra quyền sở hữu sản phẩm trước khi xóa */
    await this.GetProductByShopId(shop_id, product_id);
    
    /** Thực hiện xóa thông qua phương thức Remove dùng chung */
    return await this.Remove(product_id);
  }

  /** Xóa tất cả sản phẩm của một shop */
  async RemoveAllProductsByShopId(shop_id: string) {
    /** Lấy danh sách sản phẩm hiện tại của shop để xử lý cache */
    const PRODUCTS = await this.PRODUCTS_REPO.findMany({ where: { shop_id } });
    
    /** Thực hiện xóa hàng loạt qua repo và dọn dẹp cache */
    for (const prod of PRODUCTS) {
        /** Xóa từng sản phẩm trong DB */
        await this.PRODUCTS_REPO.remove(prod.id);
        /** Xóa cache sản phẩm lẻ */
        await this.PRODUCTS_CACHE.Delete(prod.id);
    }
    
    /** Xóa cache bản danh sách của shop */
    await this.PRODUCTS_CACHE.DeleteByShop(shop_id);
    
    /** Trả về danh sách đã xóa */
    return PRODUCTS;
  }
}
