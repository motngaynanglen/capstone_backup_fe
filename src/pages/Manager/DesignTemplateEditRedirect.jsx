import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** Chuyển URL cũ /design-templates/edit/:id → trang chi tiết sản phẩm. */
const DesignTemplateEditRedirect = ({ basePath = '/manager/products' }) => {
  const { id } = useParams();
  return <Navigate to={`${basePath}/${id}`} replace />;
};

export default DesignTemplateEditRedirect;
