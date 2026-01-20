/** Nhập khẩu kết nối Redis */
import { RedisConnection } from "../../config/redis.config";
/** Nhập khẩu Injectable decorator */
import { Injectable } from "@nestjs/common";
/** Nhập khẩu interface từ product-search service */
import { IProductItem, ISearchFilters } from "./product-search.service";
/** Nhập khẩu crypto để tạo hash cho filters */
import { createHash } from "crypto";

//#region IProductSearchCache - Giao diện bộ nhớ đệm product search
/** Định nghĩa các hành động với bộ nhớ đệm cho product search */
export interface IProductSearchCache {
    /** Lấy kết quả tìm kiếm từ cache */
    getSearchResults(keyword: string, filters?: ISearchFilters): Promise<Partial<IProductItem>[] | null>;
    /** Lưu kết quả tìm kiếm vào cache */
    setSearchResults(keyword: string, filters: ISearchFilters | undefined, results: Partial<IProductItem>[]): Promise<void>;
    /** Xóa toàn bộ cache của search results */
    invalidateSearchCache(): Promise<void>;
}
//#endregion

//#region ProductSearchCache - Thực thi bộ nhớ đệm product search
/** Lớp xử lý logic cache cho product search theo mô hình cache-aside */
@Injectable()
export class ProductSearchCache implements IProductSearchCache {
    /** Thời gian sống mặc định của cache là 30 phút (search results thay đổi thường xuyên hơn) */
    private readonly TTL = 1800;
    /** Tiền tố cho các khóa product search trong Redis theo công thức: FashionWeb:ProductSearch:Scope:Params */
    private readonly PREFIX = 'FashionWeb:ProductSearch:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection()
    ) {}

    /** Phương thức tạo hash từ filters để làm key */
    private createFiltersHash(filters?: ISearchFilters): string {
        /** Nếu không có filters thì trả về empty */
        if (!filters) return 'none';
        
        /** Tạo chuỗi JSON từ filters và hash nó */
        const filters_string = JSON.stringify({
            brand: filters.brand || '',
            category: filters.category || '',
            minPrice: filters.minPrice || 0
        });
        
        /** Tạo hash MD5 từ chuỗi filters */
        return createHash('md5').update(filters_string).digest('hex');
    }

    /** Phương thức lấy kết quả tìm kiếm từ cache */
    async getSearchResults(keyword: string, filters?: ISearchFilters): Promise<Partial<IProductItem>[] | null> {
        try {
            /** Khởi tạo hoặc lấy kết nối Redis server */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            
            /** Tạo hash từ filters */
            const filters_hash = this.createFiltersHash(filters);
            
            /** Tạo hằng số định danh khóa cache theo công thức: FashionWeb:ProductSearch:search:keyword:{keyword}:filters:{hash} */
            const KEY = `${this.PREFIX}search:keyword:${keyword}:filters:${filters_hash}`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành mảng kết quả tìm kiếm */
                return JSON.parse(DATA) as Partial<IProductItem>[];
            }

            /** Trả về null nếu cache miss */
            return null;
        } catch (error) {
            /** Ghi nhận lỗi nhưng trả về null để service tự tìm kiếm */
            console.error('Lỗi khi lấy Product Search Cache:', error);
            return null;
        }
    }

    /** Phương thức lưu kết quả tìm kiếm vào cache */
    async setSearchResults(keyword: string, filters: ISearchFilters | undefined, results: Partial<IProductItem>[]): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            
            /** Tạo hash từ filters */
            const filters_hash = this.createFiltersHash(filters);
            
            /** Tạo khóa lưu trữ theo công thức: FashionWeb:ProductSearch:search:keyword:{keyword}:filters:{hash} */
            const KEY = `${this.PREFIX}search:keyword:${keyword}:filters:${filters_hash}`;
            
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(results), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Product Search Cache:', error);
        }
    }

    /** Phương thức xóa toàn bộ cache của search results */
    async invalidateSearchCache(): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            
            /** Dùng SCAN để tìm tất cả keys của product search */
            const keys: string[] = [];
            let cursor = '0';

            /** Quét từng batch, không chặn Redis */
            do {
                const [next_cursor, found_keys] = await REDIS_CLIENT.scan(
                    cursor,
                    'MATCH',
                    `${this.PREFIX}search:*`,
                    'COUNT',
                    100
                );
                cursor = next_cursor;
                keys.push(...found_keys);
            } while (cursor !== '0');

            /** Nếu có keys thì xóa tất cả */
            if (keys.length > 0) {
                await REDIS_CLIENT.del(...keys);
            }
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi invalidate Product Search Cache:', error);
        }
    }
}
//#endregion
