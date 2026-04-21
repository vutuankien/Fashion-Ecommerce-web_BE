/** Nhập khẩu Injectable từ NestJS */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
/** Nhập khẩu cache người dùng */
import { UserCache } from './user.cache';
/** Nhập khẩu kho lưu trữ người dùng để thực hiện các thao tác ghi dữ liệu */
import { UserRepository } from './user.repository';
/** Nhập khẩu các DTO cho người dùng */
import { ICreateUserDto, IUpdateUserDto } from '../../DTO/User/user.dto';
/** Nhập khẩu dịch vụ mã hóa mật khẩu */
import { PasswordService } from '../auth/password.service';
import { IUser } from '@/interfaces/user/user.interface';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import sharp from 'sharp';

import { Logger } from '@nestjs/common';
/** Interface cho pagination options */
export interface PaginationOptions {
    page?: number;      // Trang hiện tại (bắt đầu từ 1)
    limit?: number;     // Số lượng items mỗi trang
    offset?: number;    // Hoặc dùng offset thay vì page
}

/** Interface cho kết quả trả về */
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
//#region UserService - Dịch vụ quản lý nghiệp vụ người dùng
/** Lớp điều phối logic giữa Cache và Repository */
@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    /** Hàm khởi tạo với các thành phần của lớp dữ liệu */
    constructor(
        /** Thành phần xử lý bộ nhớ đệm */
        private readonly CACHE: UserCache,
        /** Thành phần xử lý cơ sở dữ liệu gốc */
        private readonly REPO: UserRepository,
        /** Thành phần xử lý lưu trữ ảnh qua Cloudinary */
        private readonly CLOUDINARY: CloudinaryService
    ) {}

    /** Nghiệp vụ đăng ký/tạo mới người dùng */
    async Create(dto: ICreateUserDto, avatar?: Express.Multer.File) {
        /** Kiểm tra sự tồn tại của email qua lớp Cache (đã bao gồm kiểm tra DB bên dưới) */
        const EXISTING_USER = await this.CACHE.getByEmail(dto.email);
        /** Nếu đã tồn tại người dùng trùng email */
        if (EXISTING_USER) {
            /** Ném lỗi xung đột dữ liệu */
            throw new ConflictException('Email này đã được sử dụng');
        }

        /** Xử lý upload avatar lên Cloudinary nếu có file */
        if (avatar) {
            /** Upload và lấy URL ảnh đã tối ưu */
            const AVATAR_URL = await this.OptimizeAndUploadAvatar(avatar);
            /** Gán URL avatar vào DTO */
            dto.avatar_url = AVATAR_URL;
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
        
        const USER = await this.REPO.findByEmail(email);
        if (!USER) {
            throw new NotFoundException('User not found');
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
        const USER_IN_CACHE = await this.CACHE.get(id);
        /** Nếu tìm thấy */
        if(USER_IN_CACHE) return USER_IN_CACHE;

        const USER_IN_DB = await this.REPO.findById(id);
        if (!USER_IN_DB) {
            throw new NotFoundException('User not found');
        }
        
        /** Trả về người dùng */
        await this.CACHE.set(USER_IN_DB);
        return USER_IN_DB;
    }

    /** Nghiệp vụ lấy nhiều người dùng theo danh sách ID */
    async GetManyUser(
        userIds: number[],
        options?: PaginationOptions
    ): Promise<PaginatedResult<IUser>> {
        // Validate đầu vào
        if (!userIds?.length) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: options?.limit || 10,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Loại bỏ ID trùng lặp
        const uniqueUserIds = [...new Set(userIds)];
        const total = uniqueUserIds.length;

        // Thiết lập pagination params
        const limit = options?.limit || 10;
        const page = options?.page || 1;
        const offset = options?.offset ?? (page - 1) * limit;

        // Validate page/offset
        if (page < 1 || limit < 1) {
            throw new Error('Page và limit phải lớn hơn 0');
        }

        // Lấy slice của userIds theo pagination
        const paginatedUserIds = uniqueUserIds.slice(offset, offset + limit);

        // Gọi repo để tìm user
        const users = await this.REPO.findManyByIds(paginatedUserIds);

        // Tạo map để sắp xếp theo thứ tự input
        const userMap = new Map(users.map(user => [user.id, user]));
        const sortedUsers = paginatedUserIds
            .map(id => userMap.get(id))
            .filter(Boolean) as IUser[];

        // Tính toán thông tin pagination
        const totalPages = Math.ceil(total / limit);

        return {
            data: sortedUsers,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
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
    async Update(id: number, dto: IUpdateUserDto, avatar?: Express.Multer.File) {
        /** Tìm người dùng cần cập nhật */
        const USER = await this.REPO.findById(id);
        /** Nếu không tồn tại */
        if (!USER) {
            /** Ném lỗi không tìm thấy */
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        /** Xử lý upload avatar mới nếu có file */
        if (avatar) {
            /** Upload ảnh mới lên Cloudinary */
            const NEW_AVATAR_URL = await this.OptimizeAndUploadAvatar(avatar);
            /** Gán URL avatar mới vào DTO */
            dto.avatar_url = NEW_AVATAR_URL;

            /** Xóa ảnh cũ trên Cloudinary nếu tồn tại */
            if (USER.avatar_url) {
                /** Trích xuất public_id từ URL */
                const OLD_PUBLIC_ID = this.CLOUDINARY.extractPublicId(USER.avatar_url);
                /** Gọi xóa file cũ, bắt lỗi để không ảnh hưởng flow chính */
                await this.CLOUDINARY.deleteFile(OLD_PUBLIC_ID).catch(() => {
                    this.logger.warn(`Không thể xóa avatar cũ: ${OLD_PUBLIC_ID}`);
                });
            }
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

    /** Phương thức tối ưu hóa và upload avatar lên Cloudinary */
    private async OptimizeAndUploadAvatar(avatar: Express.Multer.File): Promise<string> {
        /** Kiểm tra tính hợp lệ của file */
        await this.CLOUDINARY.validateFile(avatar);

        /** Tối ưu hóa ảnh: resize 400x400, nén JPEG chất lượng 80 */
        const OPTIMIZED_BUFFER = await sharp(avatar.buffer)
            .resize(400, 400, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();

        /** Tạo object file mới với buffer đã tối ưu */
        const OPTIMIZED_FILE: Express.Multer.File = {
            ...avatar,
            buffer: OPTIMIZED_BUFFER,
            size: OPTIMIZED_BUFFER.length,
        };

        /** Upload file đã tối ưu lên Cloudinary */
        const UPLOAD_RESULT = await this.CLOUDINARY.uploadFile(OPTIMIZED_FILE, {
            folder: 'user-avatars',
        });

        /** Trả về URL ảnh bảo mật */
        return UPLOAD_RESULT.secure_url;
    }
}
//#endregion
