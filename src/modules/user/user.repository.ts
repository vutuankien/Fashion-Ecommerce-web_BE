import { PrismaService } from "../../prisma/prisma.service";
import { IUser } from "../../interfaces/user/user.interface";

//#region IUserRepository - Giao diện kho lưu trữ người dùng
/** Định nghĩa các phương thức cho kho lưu trữ người dùng */
export interface IUserRepository {
    /** Tìm một người dùng theo email */
    findByEmail(email: string): Promise<IUser | null>;
    /** Tìm một người dùng theo mã định danh */
    findById(id: number): Promise<IUser | null>;
    /** Tìm nhiều người dùng theo danh sách ID */
    findManyByIds(ids: number[]): Promise<IUser[]>;
    /** Tìm kiếm động theo các trường và giá trị */
    dynamicSearch(fields: string[], value: string, skip: number, take: number): Promise<[IUser[], number]>;
    /** Tạo mới một người dùng */
    create(data: any): Promise<IUser>;
    /** Cập nhật thông tin người dùng */
    update(id: number, data: any): Promise<IUser>;
    /** Xóa người dùng */
    delete(id: number): Promise<IUser>;
    /** Lấy danh sách người dùng có phân trang */
    findAll(skip: number, take: number): Promise<[IUser[], number]>;
}
//#endregion

//#region UserRepository - Thực thi kho lưu trữ người dùng
/** Lớp triển khai các thao tác cơ sở dữ liệu cho người dùng */
export class UserRepository implements IUserRepository {
    /** Hàm khởi tạo với PrismaService */
    constructor(
        /** Dịch vụ Prisma được cung cấp mặc định hoặc từ bên ngoài */
        private readonly PRISMA: PrismaService = new PrismaService()
    ) {}

    /** Thực hiện truy vấn tìm kiếm người dùng qua email */
    async findByEmail(email: string) {
        return this.PRISMA.user.findUnique({
            where: { email }
        });
    }

    /** Thực hiện truy vấn tìm kiếm người dùng qua ID */
    async findById(id: number): Promise<IUser | null> {
        /** Sử dụng prisma để tìm bản ghi duy nhất qua khóa chính */
        const USER = await this.PRISMA.user.findUnique({
            /** Điều kiện lọc theo id */
            where: { id }
        });
        /** Trả về đối tượng người dùng hoặc null */
        return USER as IUser | null;
    }

    /** Thực hiện lưu mới một bản ghi người dùng */
    async create(data: any): Promise<IUser> {
        /** Gọi lệnh create của prisma */
        const NEW_USER = await this.PRISMA.user.create({
            /** Dữ liệu truyền vào để tạo mới */
            data
        });
        /** Trả về bản ghi vừa được tạo */
        return NEW_USER as IUser;
    }

    /** Thực hiện cập nhật dữ liệu cho một người dùng đã tồn tại */
    async update(id: number, data: any): Promise<IUser> {
        /** Gọi lệnh update của prisma */
        const UPDATED_USER = await this.PRISMA.user.update({
            /** Xác định bản ghi cần cập nhật qua id */
            where: { id },
            /** Dữ liệu mới cần thay thế */
            data
        });
        /** Trả về dữ liệu sau khi cập nhật thành công */
        return UPDATED_USER as IUser;
    }

    /** Thực hiện xóa vĩnh viễn một bản ghi người dùng */
    async delete(id: number): Promise<IUser> {
        /** Gọi lệnh delete của prisma */
        const DELETED_USER = await this.PRISMA.user.delete({
            /** Xác định bản ghi cần xóa qua id */
            where: { id }
        });
        /** Trả về thông tin người dùng đã bị xóa */
        return DELETED_USER as IUser;
    }

    /** Truy vấn danh sách và đếm tổng số bản ghi phục vụ phân trang */
    async findAll(skip: number, take: number): Promise<[IUser[], number]> {
        /** Sử dụng Promise.all để tối ưu hóa thời gian thực thi đồng thời */
        const [USERS, TOTAL] = await Promise.all([
            /** Lấy danh sách người dùng với giới hạn và độ dời */
            this.PRISMA.user.findMany({
                /** Vị trí bắt đầu lấy */
                skip,
                /** Số lượng bản ghi cần lấy */
                take
            }),
            /** Đếm tổng số lượng bản ghi hiện có */
            this.PRISMA.user.count()
        ]);
        /** Trả về mảng chứa danh sách và tổng số */
        return [USERS as IUser[], TOTAL];
    }

    /** Tìm nhiều người dùng theo danh sách ID */
    async findManyByIds(ids: number[]): Promise<IUser[]> {
        /** Sử dụng prisma để tìm nhiều bản ghi với điều kiện id nằm trong mảng */
        const USERS = await this.PRISMA.user.findMany({
            /** Điều kiện lọc id nằm trong danh sách */
            where: {
                id: {
                    in: ids
                }
            }
        });
        /** Trả về danh sách người dùng */
        return USERS as IUser[];
    }

    /** Tìm kiếm động theo các trường và giá trị */
    async dynamicSearch(fields: string[], value: string, skip: number, take: number): Promise<[IUser[], number]> {
        /** Tạo điều kiện OR cho từng trường cần tìm kiếm */
        const OR_CONDITIONS = fields.map(field => ({
            [field]: {
                contains: value,
                mode: 'insensitive' as const
            }
        }));

        /** Điều kiện where với OR */
        const WHERE_CLAUSE = {
            OR: OR_CONDITIONS
        };

        /** Sử dụng Promise.all để thực hiện đồng thời tìm kiếm và đếm */
        const [USERS, TOTAL] = await Promise.all([
            /** Tìm kiếm với điều kiện OR */
            this.PRISMA.user.findMany({
                where: WHERE_CLAUSE,
                skip,
                take
            }),
            /** Đếm tổng số kết quả phù hợp */
            this.PRISMA.user.count({
                where: WHERE_CLAUSE
            })
        ]);

        /** Trả về danh sách và tổng số */
        return [USERS as IUser[], TOTAL];
    }
}
//#endregion
