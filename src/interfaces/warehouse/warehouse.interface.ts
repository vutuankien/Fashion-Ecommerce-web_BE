/**Interface định nghĩa cấu trúc dữ liệu của Warehouse */
export interface IWarehouse {
  /**Mã định danh của kho */
  id: string;

  /**Tên kho */
  name: string;

  /**Địa chỉ kho */
  address: string;

  /**Mã tỉnh thành */
  province_id: string;

  /**Mã quận huyện */
  district_id: string;

  /**Mã xã phường */
  commune_id: string;

  /**Số điện thoại */
  phone: string;

  /**Cho phép tạo đơn hàng */
  allow_create_order: boolean;

  /**Ngày tạo */
  createdAt: Date;

  /**Ngày cập nhật */
  updatedAt: Date;
}

/**Interface cho dữ liệu tạo mới warehouse */
export interface ICreateWarehouse {
  /**Tên kho */
  name: string;

  /**Địa chỉ kho */
  address: string;

  /**Mã tỉnh thành */
  province_id: string;

  /**Mã quận huyện */
  district_id: string;

  /**Mã xã phường */
  commune_id: string;

  /**Số điện thoại */
  phone: string;

  /**Cho phép tạo đơn hàng */
  allow_create_order?: boolean;
}

/**Interface cho dữ liệu cập nhật warehouse */
export interface IUpdateWarehouse extends Partial<ICreateWarehouse> {}
