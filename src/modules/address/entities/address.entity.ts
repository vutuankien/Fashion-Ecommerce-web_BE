export class provinces {
    /**Id của thành phố */
    id: string;
    
    /**Tên của thành phố */
    name:string;

    /**Tên tiếng Anh của thành phố */
    name_en:string;

    /**Mã định danh mới của thành phố */
    new_id:string;

    region_type: string;

    country_code : number
}


//Entity quận/huyện
export class districts{
    /**Id của quận/huyện */
    id:string;

    /**Tên của quận/huyện */
    name:string;

    /**Tên tiếng Anh của quận/huyện */
    name_en:string

    /**Id của tỉnh/thành phố trực thuộc trung ương */
    province_id:string;
}


/**Emtity xã/phường */
export class communes{
    /**Id của xã/phường */
    id:string;

    /**Tên của xã/phường */
    name:string;

    /**Tên tiếng Anh của xã/phường */
    name_en:string;

    /**Id của quận/huyện */
    district_id:string;

    new_id:string;
    /**Id của tỉnh/thành phố trực thuộc trung ương */
    province_id:string;
}