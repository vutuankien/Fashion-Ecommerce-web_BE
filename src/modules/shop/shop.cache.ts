/** Nhập khẩu giao diện shop từ Prisma */
import { shop as IShop } from "@prisma/client";
/** Nhập khẩu kết nối Redis */
import { RedisConnection } from "../../config/redis.config";
/** Nhập khẩu PrismaService để truy vấn DB khi cache miss */
import { PrismaService } from "../../prisma/prisma.service";
/** Nhập khẩu Injectable decorator */
import { Injectable } from "@nestjs/common";

//#region IShopCache - Giao diện bộ nhớ đệm shop
/** Định nghĩa các hành động với bộ nhớ đệm cho shop */
export interface IShopCache {
    /** Lấy shop từ cache hoặc DB theo id */
    get(id: string): Promise<IShop | null>;
    /** Lưu shop vào cache */
    set(shop: IShop): Promise<void>;
    /** Xóa shop khỏi cache */
    delete(id: string): Promise<void>;
    /** Kiểm tra sự tồn tại của shop theo id */
    checkExists(id: string): Promise<boolean>;
    /** Lấy danh sách shop theo trang từ cache */
    getPage(page: number, limit: number): Promise<IShop[] | null>;
    /** Lưu danh sách shop theo trang vào cache */
    setPage(page: number, limit: number, shops: IShop[]): Promise<void>;
    /** Xóa toàn bộ cache của shop */
    invalidateAll(): Promise<void>;
}
//#endregion

//#region ShopCache - Thực thi bộ nhớ đệm shop
/** Lớp xử lý logic cache cho shop theo mô hình cache-aside */
@Injectable()
export class ShopCache implements IShopCache {
    /** Thời gian sống mặc định của cache là 1 giờ */
    private readonly TTL = 3600;
    /** Tiền tố cho các khóa shop trong Redis theo công thức: FashionWeb:Shop:Scope:Params */
    private readonly PREFIX = 'FashionWeb:Shop:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection(),
        /** PrismaService để truy vấn khi không có trong cache */
        private readonly PRISMA_SERVICE: PrismaService = new PrismaService()
    ) {}

    /** Phương thức lấy thông tin shop hỗ trợ cơ chế cache-aside */
    async get(id: string): Promise<IShop | null> {
        try {
            /** Khởi tạo hoặc lấy kết nối Redis server */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo hằng số định danh khóa cache theo công thức: FashionWeb:Shop:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành đối tượng shop */
                return JSON.parse(DATA) as IShop;
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu */
            const SHOP = await this.PRISMA_SERVICE.shop.findUnique({
                where: { id }
            });

            /** Nếu tìm thấy shop trong DB */
            if (SHOP) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.set(SHOP);
            }

            /** Trả về kết quả cuối cùng */
            return SHOP;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu trữ đối tượng shop vào Redis */
    async set(shop: IShop): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa lưu trữ dựa trên id theo công thức: FashionWeb:Shop:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${shop.id}`;
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(shop), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Shop Cache:', error);
        }
    }

    /** Phương thức xóa thông tin shop khỏi bộ nhớ đệm */
    async delete(id: string): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa theo công thức: FashionWeb:Shop:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            /** Gọi lệnh xóa khóa khỏi Redis */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa Shop Cache:', error);
        }
    }

    /** Phương thức kiểm tra sự tồn tại của shop theo id */
    async checkExists(id: string): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa kiểm tra theo công thức: FashionWeb:Shop:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            /** Trả về true nếu tồn tại, ngược lại false */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lấy danh sách shop theo trang từ cache */
    async getPage(page: number, limit: number): Promise<IShop[] | null> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cho danh sách shop theo trang theo công thức: FashionWeb:Shop:list:page:{page}:limit:{limit} */
            const PAGE_KEY = `${this.PREFIX}list:page:${page}:limit:${limit}`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(PAGE_KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành mảng shops */
                return JSON.parse(DATA) as IShop[];
            }

            /** Trả về null nếu cache miss */
            return null;
        } catch (error) {
            /** Ghi nhận lỗi nhưng trả về null để service tự query */
            console.error('Lỗi khi lấy Shop Page Cache:', error);
            return null;
        }
    }

    /** Phương thức lưu danh sách shop theo trang vào cache */
    async setPage(page: number, limit: number, shops: IShop[]): Promise<void> {
        try {
            /** Kết nối tới redis_client */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cho danh sách shop theo trang theo công thức: FashionWeb:Shop:list:page:{page}:limit:{limit} */
            const PAGE_KEY = `${this.PREFIX}list:page:${page}:limit:${limit}`;
            
            /** Lưu toàn bộ danh sách vào một key */
            await REDIS_CLIENT.set(PAGE_KEY, JSON.stringify(shops), 'EX', this.TTL);

            /** Sử dụng pipeline để lưu từng shop riêng lẻ */
            const pipeline = REDIS_CLIENT.multi();

            /** Lặp qua từng shop để thêm lệnh set vào pipeline */
            for (const shop of shops) {
                /** Tạo khóa cho từng shop theo công thức: FashionWeb:Shop:detail:id:{id} */
                const key = `${this.PREFIX}detail:id:${shop.id}`;
                /** Thêm lệnh set vào pipeline với thời gian hết hạn */
                pipeline.set(key, JSON.stringify(shop), 'EX', this.TTL);
            }

            /** Thực thi tất cả lệnh trong pipeline */
            await pipeline.exec();
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Shop Page Cache:', error);
        }
    }

    /** Phương thức xóa toàn bộ cache của shop */
    async invalidateAll(): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            
            /** Dùng SCAN để tìm tất cả keys của shop */
            const keys: string[] = [];
            let cursor = '0';

            /** Quét từng batch, không chặn Redis */
            do {
                const [next_cursor, found_keys] = await REDIS_CLIENT.scan(
                    cursor,
                    'MATCH',
                    `${this.PREFIX}*`,
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
            console.error('Lỗi khi invalidate Shop Cache:', error);
        }
    }
}
//#endregion
