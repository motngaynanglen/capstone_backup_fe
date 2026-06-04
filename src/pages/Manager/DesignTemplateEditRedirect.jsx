import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** Chuyển URL cũ /design-templates/edit/:id → trang quản lý sản phẩm thống nhất. */
const DesignTemplateEditRedirect = ({ basePath = '/manager/products' }) => {
  const { id } = useParams();
  return <Navigate to={`${basePath}?editTemplate=${id}`} replace />;
};

export default DesignTemplateEditRedirect;
