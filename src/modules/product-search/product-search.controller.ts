import { Controller, Get, Query } from '@nestjs/common';
import { ProductSearchService, IProductItem } from './product-search.service';

//#region ____ ProductSearch ____
// -----------------------------------------------------------------------------

/**Cấu hình cho controller */
export interface IConfigProductSearchController {}

/**Interface cho controller tìm kiếm */
export interface IProductSearchController {
  search(q: string, brand?: string, category?: string, min_price?: string): Promise<Partial<IProductItem>[]>;
}

/**
 * Controller quản lý các API tìm kiếm sản phẩm
 */
@Controller('search')
export class ProductSearchController implements IProductSearchController {
  constructor(
    private readonly SERVICE_PRODUCT_SEARCH: ProductSearchService,
  ) { }

  /**
   * API tìm kiếm sản phẩm theo keyword và bộ lọc
   * @param {string} q - Từ khóa tìm kiếm
   * @param {string} [brand] - Lọc theo thương hiệu
   * @param {string} [category] - Lọc theo danh mục
   * @param {string} [min_price] - Lọc theo giá thấp nhất
   * @returns {Promise<Partial<IProductItem>[]>} Danh sách sản phẩm
   */
  @Get('products')
  async search(
    @Query('q') q: string,
    @Query('brand') brand?: string,
    @Query('category') category?: string,
    @Query('min_price') min_price?: string,
  ): Promise<Partial<IProductItem>[]> {
    /**Chuyển đổi giá trị min_price sang number */
    const min_price_number = min_price ? Number(min_price) : undefined;

    /**Gọi service để thực hiện tìm kiếm với các tham số */
    return await this.SERVICE_PRODUCT_SEARCH.search(q, {
      brand,
      category,
      minPrice: min_price_number,
    });
  }
}
// -----------------------------------------------------------------------------
//#endregion



