import { IPost } from "../post/post.interface";

export interface IUser {
    /*** Mã định danh người dùng*/
    id: number;

    /**Tên người dùng */
    name: string | null;

    /**Email người dùng */
    email: string;

    /**Tuổi người dùng */
    age: number | null;

    //password người dùng
    password: string;

    //avatar người dùng
    avatar_url?: string | null;

    //refresh token để làm mới phiên đăng nhập
    refreshToken?: string | null;

    //phân quyền người dùng
    role : 'user' | 'admin' | 'author'|'shop'|'employer';

    //nhà cung cấp dịch vụ email hay google
    provider: string;

    //địa chỉ
    address?: string | null;


    //số điện thoại
    phone?: string | null;

    //ngày tạo
    createdAt?: Date;

    //ngày cập nhật
    updatedAt?: Date;

}
