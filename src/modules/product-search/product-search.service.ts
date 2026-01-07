import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";

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
}

/**Bộ lọc tìm kiếm */
export interface ISearchFilters {
  brand?: string;
  category?: string;
  minPrice?: number;
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
export class ProductSearchService implements IProductSearchService {
  /**Tên index trong Elasticsearch */
  private readonly INDEX_NAME = 'products';

  constructor(
    private readonly ES_SERVICE: ElasticsearchService,
  ) { }

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
    /**Xây dựng điều kiện lọc */
    const filter_conditions = [
      filters?.brand ? { term: { brand: filters.brand } } : undefined,
      filters?.category ? { term: { category: filters.category } } : undefined,
      filters?.minPrice ? { range: { price: { gte: filters.minPrice } } } : undefined,
    ].filter((item): item is Exclude<typeof item, undefined> => item !== undefined);

    /**Thực hiện truy vấn search */
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

    /**Map kết quả trả về */
    return result.hits.hits.map(hit => hit._source as Partial<IProductItem>);
  }
}
// -----------------------------------------------------------------------------
//#endregion

