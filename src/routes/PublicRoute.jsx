import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Route dùng cho các trang public (login, register, ...) 
// Nếu đã đăng nhập thì điều hướng sang trang phù hợp với role.
// TUY NHIÊN: Với trang Home (/) và Products (/products), user đã đăng nhập vẫn được phép xem.
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Chỉ redirect nếu đang ở trang Login/Register/Forgot-password
  // Logic này nên được xử lý ở AppRouter bằng cách dùng 2 loại: PublicRoute (bắt buộc chưa login) và CommonRoute (ai cũng vào được)
  // Nhưng để sửa nhanh: ta kiểm tra xem user có đang ở trang Home không

  // Cách sửa đúng: PublicRoute chỉ nên dùng cho Login/Register.
  // Trang Home không nên bọc PublicRoute nếu muốn user đã login vẫn xem được.

  if (isAuthenticated) {
    const role = user?.role?.toLowerCase();
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    if (['employee', 'staff'].includes(role)) return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;


