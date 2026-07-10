import axiosInstance from './axiosInstance';
import { AUTH_ENDPOINTS } from './endpoints';

// Đăng ký tài khoản khách hàng
export const registerApi = async ({ username, password, fullName, email, contactPhone }) => {
  const payload = {
    username,
    password,
    fullName,
    email,
    contactPhone,
  };

  const response = await axiosInstance.post(AUTH_ENDPOINTS.REGISTER, payload);
  return response.data;
};

// Đăng nhập
export const loginApi = async ({ username, password }) => {
  const payload = {
    username,
    password,
  };

  const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, payload);
  return response.data;
};
// Đăng nhập hệ thống (dành cho Admin/Manager)
export const systemLoginApi = async ({ username, password }) => {
  const payload = { username, password };
  const response = await axiosInstance.post('/api/auth/system-login', payload);
  return response.data;
};
// Gửi yêu cầu lấy lại mật khẩu (Dùng PATCH theo đúng tài liệu BE)
export const requestForgotPasswordApi = async (email) => {
  const payload = { email };
  // Giả sử đường dẫn gốc trong axiosInstance của bạn đã có /api rồi thì chỉ cần /auth/forgot-password
  // Nếu chưa có thì bạn ghi full: /api/auth/forgot-password
  const response = await axiosInstance.patch('/api/auth/forgot-password', payload);
  return response.data;
};

// Đặt lại mật khẩu mới (Nếu có bước xác nhận OTP/Token)
// Cập nhật mật khẩu mới (Sử dụng username, token, newPassword theo Swagger)
export const resetPasswordApi = async ({ username, token, newPassword }) => {
  const payload = {
    username,
    token,
    newPassword
  };
  const response = await axiosInstance.patch('/api/auth/reset-password', payload);
  return response.data;
};

