/** Nhập khẩu giao diện categories từ Prisma */
import { categories as ICategory } from "@prisma/client";
/** Nhập khẩu kết nối Redis */
import { RedisConnection } from "../../config/redis.config";
/** Nhập khẩu PrismaService để truy vấn DB khi cache miss */
import { PrismaService } from "../../prisma/prisma.service";
/** Nhập khẩu Injectable decorator */
import { Injectable } from "@nestjs/common";

//#region ICategoriesCache - Giao diện bộ nhớ đệm categories
/** Định nghĩa các hành động với bộ nhớ đệm cho categories */
export interface ICategoriesCache {
    /** Lấy category từ cache hoặc DB theo id */
    get(id: string): Promise<ICategory | null>;
    /** Lưu category vào cache */
    set(category: ICategory): Promise<void>;
    /** Xóa category khỏi cache */
    delete(id: string): Promise<void>;
    /** Kiểm tra sự tồn tại của category theo id */
    checkExists(id: string): Promise<boolean>;
    /** Lấy tất cả categories từ cache */
    getAll(): Promise<ICategory[]>;
    /** Lưu nhiều categories vào cache */
    setAll(categories: ICategory[]): Promise<void>;
    /** Xóa toàn bộ cache của categories list */
    invalidateAll(): Promise<void>;
}
//#endregion

//#region CategoriesCache - Thực thi bộ nhớ đệm categories
/** Lớp xử lý logic cache cho categories theo mô hình cache-aside */
@Injectable()
export class CategoriesCache implements ICategoriesCache {
    /** Thời gian sống mặc định của cache là 1 giờ */
    private readonly TTL = 3600;
    /** Tiền tố cho các khóa categories trong Redis theo công thức: FashionWeb:Categories:Scope:Params */
    private readonly PREFIX = 'FashionWeb:Categories:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection(),
        /** PrismaService để truy vấn khi không có trong cache */
        private readonly PRISMA_SERVICE: PrismaService = new PrismaService()
    ) {}

    /** Phương thức lấy thông tin category hỗ trợ cơ chế cache-aside */
    async get(id: string): Promise<ICategory | null> {
        try {
            /** Khởi tạo hoặc lấy kết nối Redis server */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo hằng số định danh khóa cache theo công thức: FashionWeb:Categories:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành đối tượng category */
                return JSON.parse(DATA) as ICategory;
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu */
            const CATEGORY = await this.PRISMA_SERVICE.categories.findUnique({
                where: { id }
            });

            /** Nếu tìm thấy category trong DB */
            if (CATEGORY) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.set(CATEGORY);
            }

            /** Trả về kết quả cuối cùng */
            return CATEGORY;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu trữ đối tượng category vào Redis */
    async set(category: ICategory): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa lưu trữ dựa trên id theo công thức: FashionWeb:Categories:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${category.id}`;
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(category), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Category Cache:', error);
        }
    }

    /** Phương thức xóa thông tin category khỏi bộ nhớ đệm */
    async delete(id: string): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa theo công thức: FashionWeb:Categories:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            /** Gọi lệnh xóa khóa khỏi Redis */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa Category Cache:', error);
        }
    }

    /** Phương thức kiểm tra sự tồn tại của category theo id */
    async checkExists(id: string): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa kiểm tra theo công thức: FashionWeb:Categories:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            /** Trả về true nếu tồn tại, ngược lại false */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lấy tất cả categories từ cache */
    async getAll(): Promise<ICategory[]> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cho danh sách categories theo công thức: FashionWeb:Categories:list */
            const LIST_KEY = `${this.PREFIX}list`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(LIST_KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành mảng categories */
                return JSON.parse(DATA) as ICategory[];
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu */
            const CATEGORIES = await this.PRISMA_SERVICE.categories.findMany();

            /** Nếu tìm thấy categories trong DB */
            if (CATEGORIES && CATEGORIES.length > 0) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.setAll(CATEGORIES);
            }

            /** Trả về kết quả cuối cùng */
            return CATEGORIES;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu nhiều categories vào cache */
    async setAll(categories: ICategory[]): Promise<void> {
        try {
            /** Kết nối tới redis_client */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cho danh sách categories theo công thức: FashionWeb:Categories:list */
            const LIST_KEY = `${this.PREFIX}list`;
            
            /** Lưu toàn bộ danh sách vào một key */
            await REDIS_CLIENT.set(LIST_KEY, JSON.stringify(categories), 'EX', this.TTL);

            /** Sử dụng pipeline để lưu từng category riêng lẻ */
            const pipeline = REDIS_CLIENT.multi();

            /** Lặp qua từng category để thêm lệnh set vào pipeline */
            for (const category of categories) {
                /** Tạo khóa cho từng category theo công thức: FashionWeb:Categories:detail:id:{id} */
                const key = `${this.PREFIX}detail:id:${category.id}`;
                /** Thêm lệnh set vào pipeline với thời gian hết hạn */
                pipeline.set(key, JSON.stringify(category), 'EX', this.TTL);
            }

            /** Thực thi tất cả lệnh trong pipeline */
            await pipeline.exec();
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Categories Cache:', error);
        }
    }

    /** Phương thức xóa toàn bộ cache của categories list */
    async invalidateAll(): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            
            /** Xóa cache của list */
            const LIST_KEY = `${this.PREFIX}list`;
            await REDIS_CLIENT.del(LIST_KEY);

            /** Dùng SCAN để tìm tất cả keys của categories detail */
            const keys: string[] = [];
            let cursor = '0';

            /** Quét từng batch, không chặn Redis */
            do {
                const [next_cursor, found_keys] = await REDIS_CLIENT.scan(
                    cursor,
                    'MATCH',
                    `${this.PREFIX}detail:*`,
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
            console.error('Lỗi khi invalidate Categories Cache:', error);
        }
    }
}
//#endregion
