export interface IPost {
    /*** Mã định danh bài viết*/
    id: number;

    /**Tiêu đề bài viết */
    title: string;

    /**Nội dung bài viết */
    content: string;

    //tác giả bài viết
    author_id: number;

    //ngày tạo
    created_at?: Date;

    //ngày cập nhật
    updated_at?: Date;

    //published trạng thái bài viết
    published: boolean;

}
