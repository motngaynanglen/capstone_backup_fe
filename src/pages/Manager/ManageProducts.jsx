import React from "react";
import StaffTemplateManagement from "../Staff/StaffTemplateManagement";

const ManageProducts = ({ basePath = "/manager/products" }) => (
  <StaffTemplateManagement
    basePath={basePath}
    title="Quản lý sản phẩm"
    subtitle="Publish/unpublish, thêm, sửa và xóa mềm mẫu thiết kế 3D"
  />
);

export default ManageProducts;
