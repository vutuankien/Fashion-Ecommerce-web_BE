import { Injectable, OnModuleInit } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
/** Import ProductSearchCache */
import { ProductSearchCache } from "./product-search.cache";

//#region ____ ProductSearch ____
// -----------------------------------------------------------------------------

/**Cấu hình cho product search service */
export interface IConfigProductSearch {}

/**Dữ liệu chi tiết sản phẩm để index */
export interface IProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  keyword?: string;
  image_url?: string;
}

/**Bộ lọc tìm kiếm */
export interface ISearchFilters {
  brand?: string;
  category?: string;
  minPrice?: number;
  // keyword?: string;
}

/**Interface service tìm kiếm sản phẩm */
export interface IProductSearchService {
  createIndex(): Promise<void>;
  indexProduct(product: IProductItem): Promise<void>;
  search(keyword: string, filters?: ISearchFilters): Promise<Partial<IProductItem>[]>;
}

/**
 * Service quản lý việc tìm kiếm và index sản phẩm sử dụng Elasticsearch
 */
@Injectable()
export class ProductSearchService implements IProductSearchService, OnModuleInit {
  /**Tên index trong Elasticsearch */
  private readonly INDEX_NAME = 'products';

  constructor(
    private readonly ES_SERVICE: ElasticsearchService,
    /** Inject ProductSearchCache */
    private readonly PRODUCT_SEARCH_CACHE: ProductSearchCache
  ) { }

  /**
   * Khởi chạy khi module khởi tạo: tự động tạo index nếu chưa có
   */
  async onModuleInit(): Promise<void> {
    await this.createIndex();
  }

  /**
   * Tạo index mới nếu chưa tồn tại
   * @returns {Promise<void>}
   */
  async createIndex(): Promise<void> {
    /**Kiểm tra xem index đã tồn tại chưa */
    const is_exists = await this.ES_SERVICE.indices.exists({ index: this.INDEX_NAME });

    /**Nếu index đã tồn tại thì dừng lại */
    if (is_exists) return;

    /**Tạo index mới với mappings cụ thể */
    await this.ES_SERVICE.indices.create({
      index: this.INDEX_NAME,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          name: { type: 'text' },
          brand: { type: 'keyword' },
          category: { type: 'keyword' },
          price: { type: 'integer' },
          rating: { type: 'float' },
          createdAt: { type: 'date' },
          keyword: { type: 'text' },
          image_url: { type: 'keyword' },
        },
      },
    });
  }

  /**
   * Index data sản phẩm vào Elasticsearch
   * @param {IProductItem} product - Thông tin sản phẩm
   * @returns {Promise<void>}
   */
  async indexProduct(product: IProductItem): Promise<void> {
    /**Thực hiện index document */
    await this.ES_SERVICE.index({
      index: this.INDEX_NAME,
      id: product.id,
      document: product,
    });
  }

  /**
   * Tìm kiếm sản phẩm theo keyword và filter
   * @param {string} keyword - Từ khóa tìm kiếm
   * @param {ISearchFilters} [filters] - Các bộ lọc
   * @returns {Promise<Partial<IProductItem>[]>} Danh sách sản phẩm
   */
  async search(keyword: string, filters?: ISearchFilters): Promise<Partial<IProductItem>[]> {
    /** Kiểm tra cache trước */
    const cached_results = await this.PRODUCT_SEARCH_CACHE.getSearchResults(keyword, filters);
    
    /** Nếu có cache thì trả về luôn */
    if (cached_results) {
      return cached_results;
    }

    /** Xây dựng điều kiện lọc */
    const filter_conditions = [
      filters?.brand ? { term: { brand: filters.brand } } : undefined,
      filters?.category ? { term: { category: filters.category } } : undefined,
      filters?.minPrice ? { range: { price: { gte: filters.minPrice } } } : undefined,
    ].filter((item): item is Exclude<typeof item, undefined> => item !== undefined);

    /** Thực hiện truy vấn search */
    const result = await this.ES_SERVICE.search({
      index: this.INDEX_NAME,
      query: {
        bool: {
          must: keyword
            ? [{
              multi_match: {
                query: keyword,
                fields: ['name^2', 'brand'],
              },
            }]
            : [],
          filter: filter_conditions,
        },
      },
      sort: [
        { price: { order: 'asc' } }
      ],
    });

    /** Map kết quả trả về */
    const results = result.hits.hits.map(hit => hit._source as Partial<IProductItem>);

    /** Lưu kết quả vào cache */
    await this.PRODUCT_SEARCH_CACHE.setSearchResults(keyword, filters, results);

    return results;
  }
}
// -----------------------------------------------------------------------------
//#endregion

