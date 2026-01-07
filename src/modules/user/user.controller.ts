/** Import các decorator và module của NestJS */
import { Controller, Get, Body, Post, Param, Put, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
/** Import UserService để tương tác với cơ sở dữ liệu và nghiệp vụ người dùng */
import { UserService } from './user.service';
/** Import các DTO định nghĩa cấu trúc dữ liệu cho người dùng */
import { ICreateUserDto, IDynamicSearchDto } from 'src/DTO/User/user.dto';
/** Import ResponseHelper để trả về dữ liệu theo định dạng chuẩn */
import { ResponseHelper } from 'src/helper/response.helper';
/** Import RolesGuard để bảo vệ routes */
import { RolesGuard } from '../auth/roles.guard';
/** Import Roles decorator để phân quyền */
import { Roles } from '../auth/roles.decorator';

/** Định nghĩa controller cho endpoint 'user' */
@Controller('user')
/** Sử dụng RolesGuard cho toàn bộ controller */
@UseGuards(RolesGuard)
/** Lớp UserController chịu trách nhiệm tiếp nhận và phản hồi yêu cầu HTTP liên quan đến user */
export class UserController {

    /** Khởi tạo constructor và inject các service cần thiết */
    constructor(
        /** Inject UserService */
        private readonly USER_SERVICE: UserService
    ) {}

    /**
     * Tạo người dùng mới (chỉ dành cho quản trị viên)
     * @param user_data - Thông tin người dùng từ request body
     */
    @Post()
    /** Chỉ admin mới được tạo user */
    @Roles('admin')
    /** Hàm xử lý yêu cầu tạo người dùng */
    async Create(
        /** Lấy dữ liệu từ body */
        @Body() user_data: ICreateUserDto
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Gọi hàm Create từ UserService để lưu người dùng */
            const NEW_USER = await this.USER_SERVICE.Create(user_data);

            /** Trả về thông báo thành công cùng dữ liệu */
            return ResponseHelper.Success(NEW_USER, 'User created successfully', 201);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Xử lý lỗi hệ thống */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Tìm kiếm người dùng linh hoạt theo trường và giá trị
     * @param query - Chứa fields và value để tìm kiếm
     */
    @Get("/search")
    /** Chỉ admin mới được tìm kiếm */
    @Roles('admin')
    /** Hàm tìm kiếm linh hoạt */
    async DynamicSearch(
        /** Lấy dữ liệu tìm kiếm từ query string */
        @Query() query: IDynamicSearchDto
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Thực hiện tìm kiếm thông qua UserService */
            const RESULTS = await this.USER_SERVICE.DynamicSearch(query);

            /** Trả về kết quả thành công */
            return ResponseHelper.Success(RESULTS, 'Search results retrieved successfully', 200);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Phản hồi lỗi nếu có vấn đề xảy ra */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Lấy danh sách nhiều người dùng theo danh sách ID
     * @param user_ids - Chuỗi JSON mảng ID
     */
    @Get("/many")
    /** Chỉ admin mới được lấy nhiều user */
    @Roles('admin')
    /** Hàm xử lý lấy nhiều user */
    async GetManyUser(
        /** Query user_ids */
        @Query('user_ids') user_ids: string
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Gọi service lấy nhiều user, chuyển đổi query string sang mảng */
            const USERS = await this.USER_SERVICE.GetManyUser(JSON.parse(user_ids));

            /** Trả về kết quả thành công */
            return ResponseHelper.Success(USERS, 'Users retrieved successfully', 200);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Trả về lỗi hệ thống */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Lấy danh sách toàn bộ người dùng (chỉ người quản trị)
     * @param page - Trang hiện tại
     * @param limit - Số bản ghi trên mỗi trang
     */
    @Get()
    /** Chỉ admin mới được xem danh sách */
    @Roles('admin')
    /** Hàm xử lý lấy toàn bộ user */
    async GetAllUser(
        /** Query page */
        @Query('page') page: number,
        /** Query limit */
        @Query('limit') limit: number
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Lấy user list kèm phân trang */
            const RESULTS = await this.USER_SERVICE.GetAllUser(page, limit);

            /** Trả về thành công */
            return ResponseHelper.Success(RESULTS, 'Users retrieved successfully', 200);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Trả về lỗi hệ thống */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Lấy chi tiết thông tin một người dùng (chỉ admin)
     * @param id - ID người dùng
     */
    @Get("/:id")
    /** Chỉ admin mới được xem chi tiết */
    @Roles('admin')
    /** Hàm lấy thông tin user */
    async GetUser(@Param('id', ParseIntPipe) id: number) {
        /**
         * Lấy user từ database qua service
         */
        const user = await this.USER_SERVICE.GetUser(id);
        /** Trả về thành công */
        return ResponseHelper.Success(user, 'User retrieved successfully', 200);
    }

    /**
     * Xóa người dùng (chỉ dành cho quản trị viên)
     * @param id - ID của người dùng cần xóa
     */
    @Delete("/:id")
    /** Chỉ admin mới được xóa user */
    @Roles('admin')
    /** Hàm xử lý yêu cầu xóa người dùng */
    async Delete(
        /** Lấy ID từ tham số URL */
        @Param('id') id: string
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Gọi nghiệp vụ xóa người dùng */
            const DELETED_USER = await this.USER_SERVICE.Delete(Number(id));

            /** Trả về thông báo xóa thành công */
            return ResponseHelper.Success(DELETED_USER, 'User deleted successfully', 200);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Trả về lỗi nếu quá trình thất bại */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Cập nhật thông tin người dùng (chỉ dành cho quản trị viên)
     * @param id - ID người dùng cần cập nhật
     * @param user_data - Thông tin mới
     */
    @Put("/:id")
    /** Chỉ admin mới được cập nhật user */
    @Roles('admin')
    /** Hàm xử lý yêu cầu cập nhật */
    async Update(
        /** Lấy ID từ URL */
        @Param('id') id: string,
        /** Lấy dữ liệu mới từ body */
        @Body() user_data: ICreateUserDto
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Gọi hàm cập nhật trong service */
            const UPDATED_USER = await this.USER_SERVICE.Update(Number(id), user_data);

            /** Trả về phản hồi thành công qua helper */
            return ResponseHelper.Success(UPDATED_USER, 'User updated successfully', 200);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Trả về lỗi qua helper */
            return ResponseHelper.Error(error.message, 500);
        }
    }

    /**
     * Cập nhật thông tin profile của người dùng (cho user và admin)
     * @param id - ID người dùng cần cập nhật
     * @param user_data - Thông tin mới
     */
    @Put("/profile/:id")
    /** User và admin đều được cập nhật profile */
    @Roles('user', 'admin')
    /** Hàm xử lý yêu cầu cập nhật */
    async UserUpdate(
        /** Lấy ID từ URL */
        @Param('id') id: string,
        /** Lấy dữ liệu mới từ body */
        @Body() user_data: ICreateUserDto
    ) {
        /** Khối try để bắt lỗi */
        try {
            /** Gọi hàm cập nhật trong service */
            const UPDATED_USER = await this.USER_SERVICE.Update(Number(id), user_data);

            /** Trả về phản hồi thành công qua helper */
            return ResponseHelper.Success(UPDATED_USER, 'User updated successfully', 200);
        } /** Khối catch để xử lý lỗi */ catch (error) {
            /** Trả về lỗi qua helper */
            return ResponseHelper.Error(error.message, 500);
        }
    }
}
