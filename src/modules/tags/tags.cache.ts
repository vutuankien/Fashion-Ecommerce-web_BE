/** Nhập khẩu giao diện tags từ Prisma */
import { tags as ITag } from "@prisma/client";
/** Nhập khẩu kết nối Redis */
import { RedisConnection } from "../../config/redis.config";
/** Nhập khẩu PrismaService để truy vấn DB khi cache miss */
import { PrismaService } from "../../prisma/prisma.service";
/** Nhập khẩu Injectable decorator */
import { Injectable } from "@nestjs/common";

//#region ITagsCache - Giao diện bộ nhớ đệm tags
/** Định nghĩa các hành động với bộ nhớ đệm cho tags */
export interface ITagsCache {
    /** Lấy tag từ cache hoặc DB theo id */
    get(id: string): Promise<ITag | null>;
    /** Lưu tag vào cache */
    set(tag: ITag): Promise<void>;
    /** Xóa tag khỏi cache */
    delete(id: string): Promise<void>;
    /** Kiểm tra sự tồn tại của tag theo id */
    checkExists(id: string): Promise<boolean>;
    /** Lấy tất cả tags từ cache */
    getAll(): Promise<ITag[]>;
    /** Lưu nhiều tags vào cache */
    setAll(tags: ITag[]): Promise<void>;
    /** Xóa toàn bộ cache của tags list */
    invalidateAll(): Promise<void>;
}
//#endregion

//#region TagsCache - Thực thi bộ nhớ đệm tags
/** Lớp xử lý logic cache cho tags theo mô hình cache-aside */
@Injectable()
export class TagsCache implements ITagsCache {
    /** Thời gian sống mặc định của cache là 1 giờ */
    private readonly TTL = 3600;
    /** Tiền tố cho các khóa tags trong Redis theo công thức: FashionWeb:Tags:Scope:Params */
    private readonly PREFIX = 'FashionWeb:Tags:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection(),
        /** PrismaService để truy vấn khi không có trong cache */
        private readonly PRISMA_SERVICE: PrismaService = new PrismaService()
    ) {}

    /** Phương thức lấy thông tin tag hỗ trợ cơ chế cache-aside */
    async get(id: string): Promise<ITag | null> {
        try {
            /** Khởi tạo hoặc lấy kết nối Redis server */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo hằng số định danh khóa cache theo công thức: FashionWeb:Tags:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành đối tượng tag */
                return JSON.parse(DATA) as ITag;
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu */
            const TAG = await this.PRISMA_SERVICE.tags.findUnique({
                where: { id }
            });

            /** Nếu tìm thấy tag trong DB */
            if (TAG) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.set(TAG);
            }

            /** Trả về kết quả cuối cùng */
            return TAG;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu trữ đối tượng tag vào Redis */
    async set(tag: ITag): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa lưu trữ dựa trên id theo công thức: FashionWeb:Tags:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${tag.id}`;
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(tag), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Tag Cache:', error);
        }
    }

    /** Phương thức xóa thông tin tag khỏi bộ nhớ đệm */
    async delete(id: string): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa theo công thức: FashionWeb:Tags:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            /** Gọi lệnh xóa khóa khỏi Redis */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa Tag Cache:', error);
        }
    }

    /** Phương thức kiểm tra sự tồn tại của tag theo id */
    async checkExists(id: string): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa kiểm tra theo công thức: FashionWeb:Tags:detail:id:{id} */
            const KEY = `${this.PREFIX}detail:id:${id}`;
            /** Trả về true nếu tồn tại, ngược lại false */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lấy tất cả tags từ cache */
    async getAll(): Promise<ITag[]> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cho danh sách tags theo công thức: FashionWeb:Tags:list */
            const LIST_KEY = `${this.PREFIX}list`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(LIST_KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành mảng tags */
                return JSON.parse(DATA) as ITag[];
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu */
            const TAGS = await this.PRISMA_SERVICE.tags.findMany();

            /** Nếu tìm thấy tags trong DB */
            if (TAGS && TAGS.length > 0) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.setAll(TAGS);
            }

            /** Trả về kết quả cuối cùng */
            return TAGS;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu nhiều tags vào cache */
    async setAll(tags: ITag[]): Promise<void> {
        try {
            /** Kết nối tới redis_client */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cho danh sách tags theo công thức: FashionWeb:Tags:list */
            const LIST_KEY = `${this.PREFIX}list`;
            
            /** Lưu toàn bộ danh sách vào một key */
            await REDIS_CLIENT.set(LIST_KEY, JSON.stringify(tags), 'EX', this.TTL);

            /** Sử dụng pipeline để lưu từng tag riêng lẻ */
            const pipeline = REDIS_CLIENT.multi();

            /** Lặp qua từng tag để thêm lệnh set vào pipeline */
            for (const tag of tags) {
                /** Tạo khóa cho từng tag theo công thức: FashionWeb:Tags:detail:id:{id} */
                const key = `${this.PREFIX}detail:id:${tag.id}`;
                /** Thêm lệnh set vào pipeline với thời gian hết hạn */
                pipeline.set(key, JSON.stringify(tag), 'EX', this.TTL);
            }

            /** Thực thi tất cả lệnh trong pipeline */
            await pipeline.exec();
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Tags Cache:', error);
        }
    }

    /** Phương thức xóa toàn bộ cache của tags list */
    async invalidateAll(): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            
            /** Xóa cache của list */
            const LIST_KEY = `${this.PREFIX}list`;
            await REDIS_CLIENT.del(LIST_KEY);

            /** Dùng SCAN để tìm tất cả keys của tags detail */
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
            console.error('Lỗi khi invalidate Tags Cache:', error);
        }
    }
}
//#endregion
