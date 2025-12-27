export interface IAuthor {
    /*** Mã định danh tác giả*/
    id: number;

    /**Tên tác giả */
    name: string;

    /**Email tác giả */
    email: string;

    /**Tiểu sử tác giả */
    bio?: string;

    //ảnh đại diện tác giả
    avatar_url?: string;

    //ngày tạo
    created_at?: Date;

    //ngày cập nhật
    updated_at?: Date;
    
}
