/** Nhập khẩu giao diện sản phẩm từ Prisma */
import { products as IProduct } from "@prisma/client";
/** Nhập khẩu kết nối Redis */
import { RedisConnection } from "../../config/redis.config";
/** Nhập khẩu kho lưu trữ sản phẩm để truy vấn DB khi cache miss */
import { ProductsRepo } from "./products.repo";
/** Nhập khẩu PrismaService để khởi tạo Repo nếu cần */
import { PrismaService } from "../../prisma/prisma.service";
import { Injectable } from "@nestjs/common";

//#region IProductCache - Giao diện bộ nhớ đệm sản phẩm
/** Định nghĩa các hành động với bộ nhớ đệm cho sản phẩm */
export interface IProductCache {
    /** Lấy sản phẩm từ cache hoặc DB theo id */
    get(id: string): Promise<IProduct | null>;
    /** Lưu sản phẩm vào cache */
    set(product: IProduct): Promise<void>;
    /** Xóa sản phẩm khỏi cache */
    delete(id: string): Promise<void>;
    /** Kiểm tra sự tồn tại của sản phẩm theo id */
    checkExists(id: string): Promise<boolean>;
    /** Lấy tất cả sản phẩm từ cache */
    getAll(): Promise<IProduct[]>;
    /** Lưu nhiều sản phẩm vào cache */
    setAll(products: IProduct[]): Promise<void>;
}
//#endregion

//#region ProductsCache - Thực thi bộ nhớ đệm sản phẩm
/** Lớp xử lý logic cache cho sản phẩm theo mô hình Repo -> Cache */
@Injectable()
export class ProductsCache implements IProductCache {
    /** Thời gian sống mặc định của cache là 1 giờ */
    private readonly TTL = 3600;
    /** Tiền tố cho các khóa sản phẩm trong Redis */
    private readonly PREFIX = 'product:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection(),
        /** Kho lưu trữ sản phẩm để truy vấn khi không có trong cache */
        private readonly REPO: ProductsRepo = new ProductsRepo(new PrismaService())
    ) {}

    /** Phương thức lấy thông tin sản phẩm hỗ trợ cơ chế cache-aside */
    async get(id: string): Promise<IProduct | null> {
        try {
            /** Khởi tạo hoặc lấy kết nối Redis server */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo hằng số định danh khóa cache */
            const KEY = `${this.PREFIX}${id}`;
            
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành đối tượng sản phẩm */
                return JSON.parse(DATA) as IProduct;
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu qua Repo */
            const PRODUCT = await this.REPO.findOne(id);

            /** Nếu tìm thấy sản phẩm trong DB */
            if (PRODUCT) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.set(PRODUCT);
            }

            /** Trả về kết quả cuối cùng */
            return PRODUCT;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu trữ đối tượng sản phẩm vào Redis */
    async set(product: IProduct): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa lưu trữ dựa trên id */
            const KEY = `${this.PREFIX}${product.id}`;
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(product), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính */
            console.error('Lỗi khi lưu Product Cache:', error);
        }
    }

    /** Phương thức xóa thông tin sản phẩm khỏi bộ nhớ đệm */
    async delete(id: string): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa */
            const KEY = `${this.PREFIX}${id}`;
            /** Gọi lệnh xóa khóa khỏi Redis */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa Product Cache:', error);
        }
    }

    /** Phương thức kiểm tra sự tồn tại của sản phẩm theo id */
    async checkExists(id: string): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa kiểm tra */
            const KEY = `${this.PREFIX}${id}`;
            /** Trả về true nếu tồn tại, ngược lại false */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lấy tất cả sản phẩm từ cache */
    async getAll(): Promise<IProduct[]> {
        const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});

        // Dùng SCAN thay vì KEYS (không chặn Redis)
        const keys: string[] = [];
        let cursor = '0';

        // Quét từng batch, không chặn Redis
        do {
            const [nextCursor, foundKeys] = await REDIS_CLIENT.scan(
                cursor,
                'MATCH',
                `${this.PREFIX}*`,
                'COUNT',
                100  // Quét mỗi lần 100 keys
            );
            cursor = nextCursor;
            keys.push(...foundKeys);
        } while (cursor !== '0');

        if (keys.length === 0) return [];

        // Dùng MGET để lấy TẤT CẢ giá trị chỉ trong 1 lần gọi
        const values = await REDIS_CLIENT.mget(keys);

        // Lọc và chuyển đổi dữ liệu
        return values
            .filter((data): data is string => data !== null)
            .map(data => JSON.parse(data) as IProduct);
    }

    /** Phương thức lưu nhiều sản phẩm vào cache */
    async setAll(products: IProduct[]): Promise<void> {
        /**Kết nối tới redis_client */
        const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
        /**Sử dụng pipeline để tối ưu hoá việc set nhiều key */
        const pipeline = REDIS_CLIENT.multi();

        /**Lặp qua từng sản phẩm để thêm lệnh set vào pipeline */
        for (const product of products) {
            const key = `${this.PREFIX}${product.id}`;
            /** Thêm lệnh set vào pipeline với thời gian hết hạn */
            pipeline.set(key, JSON.stringify(product), 'EX', this.TTL);
        }

        /**Thực thi tất cả lệnh trong pipeline */
        await pipeline.exec();
    }
}
//#endregion