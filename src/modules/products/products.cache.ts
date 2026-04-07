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
    Get(id: string): Promise<IProduct | null>;
    /** Lưu sản phẩm vào cache */
    Set(product: IProduct): Promise<void>;
    /** Xóa sản phẩm khỏi cache */
    Delete(id: string): Promise<void>;
    /** Kiểm tra sự tồn tại của sản phẩm theo id */
    CheckExists(id: string): Promise<boolean>;
    /** Lấy tất cả sản phẩm từ cache */
    GetAll(): Promise<IProduct[]>;
    /** Lưu nhiều sản phẩm vào cache */
    SetAll(products: IProduct[]): Promise<void>;
    /** Lấy tất cả sản phẩm của một shop từ cache */
    GetAllByShopId(shop_id: string): Promise<IProduct[]>;
    /** Xóa cache tất cả sản phẩm của một shop */
    DeleteByShop(shop_id: string): Promise<void>;
}
//#endregion

//#region ProductsCache - Thực thi bộ nhớ đệm sản phẩm
/** Lớp xử lý logic cache cho sản phẩm theo mô hình Repo -> Cache */
@Injectable()
export class ProductsCache implements IProductCache {
    /** Thời gian sống mặc định của cache là 1 giờ */
    private readonly TTL = 3600;
    /** Tiền tố cho các khóa sản phẩm đơn lẻ trong Redis */
    private readonly PRODUCT_PREFIX = 'product:';
    /** Tiền tố cho các khóa danh sách sản phẩm theo shop trong Redis */
    private readonly SHOP_PRODUCTS_PREFIX = 'shop_products:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection(),
        /** Kho lưu trữ sản phẩm để truy vấn khi không có trong cache */
        private readonly REPO: ProductsRepo = new ProductsRepo(new PrismaService())
    ) {}
    /** Phương thức lấy tất cả sản phẩm của shop từ cache */
    async GetAllByShopId(shop_id: string): Promise<IProduct[]> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa danh sách sản phẩm của shop */
            const KEY = `${this.SHOP_PRODUCTS_PREFIX}${shop_id}`;
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);
            /** Nếu có dữ liệu trong cache thì trả về luôn */
            if (DATA) return JSON.parse(DATA) as IProduct[];
            /** Nếu cache miss, lấy từ DB thông qua Repo */
            const PRODUCTS = await this.REPO.findMany({
                where: { shop_id }
            });
            /** Lưu danh sách vào cache cho lần lấy sau */
            await this.SetShopProducts(shop_id, PRODUCTS);
            /** Trả về danh sách sản phẩm */
            return PRODUCTS;
        } catch (error) {
            /** Ném lỗi lên lớp Service */
            throw error;
        }
    }

    /** Phương thức lưu danh sách sản phẩm của shop vào Redis */
    private async SetShopProducts(shop_id: string, products: IProduct[]): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa danh sách sản phẩm của shop */
            const KEY = `${this.SHOP_PRODUCTS_PREFIX}${shop_id}`;
            /** Lưu vào Redis với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(products), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi lưu cache */
            console.error('Lỗi khi lưu Shop Products Cache:', error);
        }
    }

    /** Phương thức xóa cache danh sách sản phẩm của một shop */
    async DeleteByShop(shop_id: string): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa */
            const KEY = `${this.SHOP_PRODUCTS_PREFIX}${shop_id}`;
            /** Thực hiện xóa khóa */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa Shop Products Cache:', error);
        }
    }

    /** Phương thức lấy thông tin sản phẩm hỗ trợ cơ chế cache-aside */
    async Get(id: string): Promise<IProduct | null> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo hằng số định danh khóa cache */
            const KEY = `${this.PRODUCT_PREFIX}${id}`;
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);
            /** Kiểm tra nếu dữ liệu tồn tại trong cache thì trả về */
            if (DATA) return JSON.parse(DATA) as IProduct;
            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu qua Repo */
            const PRODUCT = await this.REPO.findOne(id);
            /** Nếu tìm thấy sản phẩm trong DB thì lưu vào cache */
            if (PRODUCT) await this.Set(PRODUCT);
            /** Trả về kết quả cuối cùng */
            return PRODUCT;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu trữ đối tượng sản phẩm vào Redis */
    async Set(product: IProduct): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa lưu trữ dựa trên id */
            const KEY = `${this.PRODUCT_PREFIX}${product.id}`;
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(product), 'EX', this.TTL);
            /** Khi cập nhật sản phẩm, xóa cache danh sách của shop chứa sản phẩm đó */
            await this.DeleteByShop(product.shop_id);
        } catch (error) {
            /** Ghi nhận lỗi lưu cache */
            console.error('Lỗi khi lưu Product Cache:', error);
        }
    }

    /** Phương thức xóa thông tin sản phẩm khỏi bộ nhớ đệm */
    async Delete(id: string): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa */
            const KEY = `${this.PRODUCT_PREFIX}${id}`;
            /** Gọi lệnh xóa khóa khỏi Redis */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa Product Cache:', error);
        }
    }

    /** Phương thức kiểm tra sự tồn tại của sản phẩm theo id */
    async CheckExists(id: string): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa kiểm tra */
            const KEY = `${this.PRODUCT_PREFIX}${id}`;
            /** Trả về trạng thái tồn tại */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lấy tất cả sản phẩm từ cache */
    async GetAll(): Promise<IProduct[]> {
        /** Lấy đối tượng điều khiển Redis */
        const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
        /** Danh sách khóa sản phẩm */
        const keys: string[] = [];
        /** Con trỏ quét */
        let cursor = '0';
        /** Quét từng batch, không chặn Redis */
        do {
            /** Thực hiện lệnh SCAN để tìm các khóa sản phẩm */
            const [nextCursor, foundKeys] = await REDIS_CLIENT.scan(cursor, 'MATCH', `${this.PRODUCT_PREFIX}*`, 'COUNT', 100);
            /** Cập nhật con trỏ tiếp theo */
            cursor = nextCursor;
            /** Thêm các khóa tìm thấy vào danh sách */
            keys.push(...foundKeys);
        } while (cursor !== '0');
        /** Nếu không có khóa nào thì trả về mảng rỗng */
        if (keys.length === 0) return [];
        /** Dùng MGET để lấy TẤT CẢ giá trị một lần */
        const values = await REDIS_CLIENT.mget(keys);
        /** Lọc và chuyển đổi dữ liệu chuỗi sang đối tượng */
        return values.filter((data): data is string => data !== null).map(data => JSON.parse(data) as IProduct);
    }

    /** Phương thức lưu nhiều sản phẩm vào cache */
    async SetAll(products: IProduct[]): Promise<void> {
        /** Kết nối tới redis_client */
        const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
        /** Sử dụng pipeline để tối ưu hoá việc set nhiều key */
        const pipeline = REDIS_CLIENT.multi();
        /** Lặp qua từng sản phẩm để thêm lệnh set vào pipeline */
        for (const product of products) {
            /** Tạo khóa cho sản phẩm với tiền tố quy định */
            const key = `${this.PRODUCT_PREFIX}${product.id}`;
            /** Thêm lệnh set vào pipeline với thời gian hết hạn */
            pipeline.set(key, JSON.stringify(product), 'EX', this.TTL);
        }
        /** Thực thi tất cả lệnh trong pipeline */
        await pipeline.exec();
    }
}
//#endregion