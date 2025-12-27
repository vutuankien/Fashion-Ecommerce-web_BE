/** Nhập khẩu Injectable từ NestJS */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
/** Nhập khẩu cache người dùng */
import { UserCache } from './user.cache';
/** Nhập khẩu kho lưu trữ người dùng để thực hiện các thao tác ghi dữ liệu */
import { UserRepository } from './user.repository';
/** Nhập khẩu các DTO cho người dùng */
import { ICreateUserDto } from '../../DTO/User/user.dto';
/** Nhập khẩu dịch vụ mã hóa mật khẩu */
import { PasswordService } from '../auth/password.service';

//#region UserService - Dịch vụ quản lý nghiệp vụ người dùng
/** Lớp điều phối logic giữa Cache và Repository */
@Injectable()
export class UserService {
    /** Hàm khởi tạo với các thành phần của lớp dữ liệu */
    constructor(
        /** Thành phần xử lý bộ nhớ đệm */
        private readonly CACHE: UserCache = new UserCache(),
        /** Thành phần xử lý cơ sở dữ liệu gốc */
        private readonly REPO: UserRepository = new UserRepository()
    ) {}

    /** Nghiệp vụ đăng ký/tạo mới người dùng */
    async Create(dto: ICreateUserDto) {
        /** Kiểm tra sự tồn tại của email qua lớp Cache (đã bao gồm kiểm tra DB bên dưới) */
        const EXISTING_USER = await this.CACHE.getByEmail(dto.email);
        /** Nếu đã tồn tại người dùng trùng email */
        if (EXISTING_USER) {
            /** Ném lỗi xung đột dữ liệu */
            throw new ConflictException('Email này đã được sử dụng');
        }

        /** Xử lý băm mật khẩu bảo mật */
        const HASHED_PASSWORD = await PasswordService.HashPassword(dto.password || 'Test123@');

        /** Thực hiện lưu trữ vào cơ sở dữ liệu qua Repo */
        const NEW_USER = await this.REPO.create({
            /** Giải nén các thuộc tính từ DTO */
            ...dto,
            /** Thay thế mật khẩu bằng chuỗi đã được băm */
            password: HASHED_PASSWORD
        });

        /** Cập nhật thông tin vào cache để tối ưu lần truy vấn sau */
        await this.CACHE.set(NEW_USER);

        /** Trả về thông tin người dùng mới */
        return NEW_USER;
    }

    /** Nghiệp vụ lấy thông tin chi tiết một người dùng */
    async GetUserByEmail(email: string) {
        /** Tìm kiếm thông tin qua lớp Cache */
        const USER = await this.CACHE.getByEmail(email);

        /** Nếu không tìm thấy người dùng */
        if (!USER) {
            /** Ném lỗi không tìm thấy tài nguyên */
            throw new NotFoundException('Không tìm thấy người dùng');
        }
        /** Trả về đối tượng người dùng */
        return USER;
    }

    /** Nghiệp vụ lấy danh sách người dùng phân trang */
    async GetAllUser(page: number = 1, limit: number = 10) {
        const PAGE_VAL = Math.max(1, page);
        const LIMIT_VAL = Math.max(1, limit);
        const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

        // Thử lấy tất cả từ cache
        let ALL_USERS = await this.CACHE.getAll();

        // Nếu cache rỗng hoặc hết hạn, lấy từ DB
        if (ALL_USERS.length === 0) {
            // Lấy tất cả người dùng từ DB
            const [users] = await this.REPO.findAll(0, 999999); // Lấy tất cả
            // Cập nhật biến allUsers
            ALL_USERS = users;

            // Lưu vào cache
            if (ALL_USERS.length > 0) {
                await this.CACHE.setAll(ALL_USERS);
            }
        }

        // Phân trang dữ liệu từ cache
        const PAGINATED_USERS = ALL_USERS.slice(SKIP, SKIP + LIMIT_VAL);

        return {
            data: PAGINATED_USERS,
            pagination: {
                page: PAGE_VAL,
                limit: LIMIT_VAL,
                total: ALL_USERS.length,
                totalPages: Math.ceil(ALL_USERS.length / LIMIT_VAL)
            }
        };
    }

    /** Nghiệp vụ xóa người dùng */
    async Delete(id: number) {
        /** Tìm kiếm người dùng trước khi xóa để lấy email phục vụ xóa cache */
        const USER = await this.REPO.findById(id);
        /** Nếu không tồn tại người dùng cần xóa */
        if (!USER) {
            /** Ném lỗi */
            throw new NotFoundException('Người dùng không tồn tại');
        }

        /** Thực hiện xóa trong cơ sở dữ liệu */
        await this.REPO.delete(id);
        /** Đồng bộ hành động xóa bộ nhớ đệm */
        await this.CACHE.delete(id);

        /** Thông báo thành công */
        return { message: 'Xóa người dùng thành công' };
    }

    /** Nghiệp vụ lấy thông tin một người dùng theo ID */
    async GetUser(id: number) {
        /** Tìm kiếm người dùng theo ID */
        const USER = await this.CACHE.get(id);
        /** Nếu không tìm thấy */
        if (!USER) {
            /** Ném lỗi không tìm thấy */
            throw new NotFoundException('Không tìm thấy người dùng');
        }
        /** Trả về người dùng */
        return USER;
    }

    /** Nghiệp vụ lấy nhiều người dùng theo danh sách ID */
    async GetManyUser(userIds: number[]) {
        /** Gọi repo để tìm nhiều user */
        const USERS = await this.REPO.findManyByIds(userIds);
        /** Trả về danh sách */
        return USERS;
    }

    /** Nghiệp vụ tìm kiếm động theo trường và giá trị */
    async DynamicSearch(query: { fields: string; value: string; page?: number; limit?: number }) {
        /** Lấy giá trị page và limit với giá trị mặc định */
        const PAGE = Math.max(1, query.page || 1);
        const LIMIT = Math.max(1, query.limit || 10);
        const SKIP = (PAGE - 1) * LIMIT;

        /** Chuyển đổi chuỗi fields thành mảng */
        const SEARCH_FIELDS = query.fields.split(',').map(f => f.trim());

        /** Gọi repo để tìm kiếm động */
        const [USERS, TOTAL] = await this.REPO.dynamicSearch(SEARCH_FIELDS, query.value, SKIP, LIMIT);

        /** Trả về kết quả với phân trang */
        return {
            data: USERS,
            pagination: {
                page: PAGE,
                limit: LIMIT,
                total: TOTAL,
                totalPages: Math.ceil(TOTAL / LIMIT)
            }
        };
    }

    /** Nghiệp vụ cập nhật thông tin người dùng */
    async Update(id: number, dto: ICreateUserDto) {
        /** Tìm người dùng cần cập nhật */
        const USER = await this.REPO.findById(id);
        /** Nếu không tồn tại */
        if (!USER) {
            /** Ném lỗi không tìm thấy */
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        /** Nếu có mật khẩu mới thì băm */
        const UPDATE_DATA = { ...dto };
        if (dto.password) {
            UPDATE_DATA.password = await PasswordService.HashPassword(dto.password);
        }

        /** Thực hiện cập nhật qua repo */
        const UPDATED_USER = await this.REPO.update(id, UPDATE_DATA);

        /** Cập nhật cache */
        await this.CACHE.delete(id);
        await this.CACHE.set(UPDATED_USER);

        /** Trả về người dùng đã cập nhật */
        return UPDATED_USER;
    }
}
//#endregion
