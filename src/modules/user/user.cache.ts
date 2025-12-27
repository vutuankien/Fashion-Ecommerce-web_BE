/** Nhập khẩu giao diện người dùng */
import { IUser } from "../../interfaces/user/user.interface";
/** Nhập khẩu kết nối Redis */
import { RedisConnection } from "../../config/redis.config";
/** Nhập khẩu kho lưu trữ người dùng để truy vấn DB khi cache miss */
import { UserRepository } from "./user.repository";
import { Injectable } from "@nestjs/common";

//#region IUserCache - Giao diện bộ nhớ đệm người dùng
/** Định nghĩa các hành động với bộ nhớ đệm */
export interface IUserCache {
    /** Lấy người dùng từ cache hoặc DB theo id */
    get(id: number): Promise<IUser | null>;
    /** Lấy người dùng từ DB theo email */
    getByEmail(email: string): Promise<IUser | null>;
    /** Lưu người dùng vào cache */
    set(user: IUser): Promise<void>;
    /** Xóa người dùng khỏi cache */
    delete(id: number): Promise<void>;
    /** Kiểm tra sự tồn tại của người dùng theo id */
    checkExists(id: number): Promise<boolean>;
    /** Kiểm tra sự tồn tại của người dùng theo email */
    checkExistsByEmail(email: string): Promise<boolean>;
    /** Lấy tất cả người dùng từ cache */
    getAll(): Promise<IUser[]>;
    /** Lưu nhiều người dùng vào cache */
    setAll(users: IUser[]): Promise<void>;
}
//#endregion

//#region UserCache - Thực thi bộ nhớ đệm người dùng
/** Lớp xử lý logic cache cho người dùng theo mô hình Repo -> Cache */
@Injectable()
export class UserCache implements IUserCache {
    /** Thời gian sống mặc định của cache là 1 giờ */
    private readonly TTL = 3600;
    /** Tiền tố cho các khóa người dùng trong Redis */
    private readonly PREFIX = 'user:';

    /** Hàm khởi tạo với các phụ thuộc cần thiết */
    constructor(
        /** Thành phần kết nối Redis */
        private readonly REDIS_CONN: RedisConnection = new RedisConnection(),
        /** Kho lưu trữ người dùng để truy vấn khi không có trong cache */
        private readonly REPO: UserRepository = new UserRepository()
    ) {}

    /**Phương thức kiểm tra sự tồn tại của người dùng theo id */
    async checkExists(id: number): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /**Kiểm tra trong database vì cache sử dụng id làm key */
            const KEY = `${this.PREFIX}${id}`;
            /**Trả về true nếu tồn tại, ngược lại false */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /**Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /**Phương thức kiểm tra sự tồn tại của người dùng theo email */
    async checkExistsByEmail(email: string): Promise<boolean> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /**Kiểm tra trong database */
            const KEY = `${this.PREFIX}${email}`;
            /**Trả về true nếu tồn tại, ngược lại false */
            return await REDIS_CLIENT.exists(KEY) > 0;
        } catch (error) {
            /**Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lấy người dùng theo email */
    async getByEmail(email: string): Promise<IUser | null> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /**Tìm kiếm trong database qua email */
            const KEY = `${this.PREFIX}${email}`;
            const DATA = await REDIS_CLIENT.get(KEY);
            
            /**Nếu tìm thấy, lưu vào cache để tối ưu lần sau */
            if (DATA) {
                const USER = JSON.parse(DATA) as IUser;
                await this.set(USER);
                return USER;
            }
            
            /**Trả về kết quả */
            return null;
        } catch (error) {
            /**Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }


    /** Phương thức lấy thông tin người dùng hỗ trợ cơ chế cache-aside */
    async get(id: number): Promise<IUser | null> {
        try {
            /** Khởi tạo hoặc lấy kết nối Redis server */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo hằng số định danh khóa cache */
            const KEY = `${this.PREFIX}${id}`;
            /** Truy vấn dữ liệu từ Redis */
            const DATA = await REDIS_CLIENT.get(KEY);

            /** Kiểm tra nếu dữ liệu tồn tại trong cache */
            if (DATA) {
                /** Giải mã chuỗi JSON thành đối tượng người dùng */
                return JSON.parse(DATA) as IUser;
            }

            /** Nếu cache miss, thực hiện tìm kiếm trong cơ sở dữ liệu qua Repo */
            const USER = await this.REPO.findById(id);

            /** Nếu tìm thấy người dùng trong DB */
            if (USER) {
                /** Lưu lại vào cache để phục vụ các lần truy vấn sau */
                await this.set(USER);
            }

            /** Trả về kết quả cuối cùng */
            return USER;
        } catch (error) {
            /** Ném lỗi ra lớp Service xử lý */
            throw error;
        }
    }

    /** Phương thức lưu trữ đối tượng người dùng vào Redis */
    async set(user: IUser): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa lưu trữ dựa trên id */
            const KEY = `${this.PREFIX}${user.id}`;
            /** Thực hiện lưu chuỗi JSON với thời gian hết hạn */
            await REDIS_CLIENT.set(KEY, JSON.stringify(user), 'EX', this.TTL);
        } catch (error) {
            /** Ghi nhận lỗi nhưng không làm gián đoạn luồng chính nếu cần */
            console.error('Lỗi khi lưu User Cache:', error);
        }
    }

    /** Phương thức xóa thông tin người dùng khỏi bộ nhớ đệm */
    async delete(id: number): Promise<void> {
        try {
            /** Lấy đối tượng điều khiển Redis */
            const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
            /** Tạo khóa cần xóa */
            const KEY = `${this.PREFIX}${id}`;
            /** Gọi lệnh xóa khóa khỏi Redis */
            await REDIS_CLIENT.del(KEY);
        } catch (error) {
            /** Ghi nhận lỗi xóa cache */
            console.error('Lỗi khi xóa User Cache:', error);
        }
    }

    async getAll(): Promise<IUser[]> {
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
            .map(data => JSON.parse(data) as IUser);
    }

    async setAll(users: IUser[]): Promise<void> {
        /**Kết nối tới redis_client */
        const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
        /**Sử dụng pipeline để tối ưu hoá việc set nhiều key */
        const pipeline = REDIS_CLIENT.multi();

        /**Lặp qua từng người dùng để thêm lệnh set vào pipeline */
        for (const user of users) {
            const key = `${this.PREFIX}${user.id}`;
            /** Thêm lệnh set vào pipeline với thời gian hết hạn */
            pipeline.set(key, JSON.stringify(user), 'EX', this.TTL);
        }

        /**Thực thi tất cả lệnh trong pipeline */
        await pipeline.exec();
    }
}
//#endregion