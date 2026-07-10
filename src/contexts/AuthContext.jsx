import React, { createContext, useState, useContext, useEffect } from 'react';
// Import thêm systemLoginApi
import { loginApi, registerApi, systemLoginApi } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên đăng nhập khi load lại trang
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Lỗi khi parse dữ liệu user từ localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // --- HÀM HỖ TRỢ XỬ LÝ DỮ LIỆU USER SAU KHI LOGIN ---
  const handleAuthSuccess = (data) => {
    const userFromApi = {
      id: data.accountId,
      username: data.userName,
      fullName: data.fullName,
      image: data.image,
      role: data.role,
    };

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    setUser(userFromApi);
    localStorage.setItem('user', JSON.stringify(userFromApi));
    return userFromApi;
  };

  // 1. Đăng nhập Khách hàng (Thường)
  const login = async (username, password) => {
    try {
      const res = await loginApi({ username, password });

      if (res?.statusCode !== 200 || res?.code !== 'SUCCESS') {
        return { success: false, message: res?.message || 'Tài khoản hoặc mật khẩu không chính xác' };
      }

      const userObj = handleAuthSuccess(res.data);
      return { success: true, user: userObj };
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.';
      return { success: false, message };
    }
  };

  // 2. Đăng nhập Hệ thống (Admin / Manager / Staff)
  const systemLogin = async (username, password) => {
    try {
      const res = await systemLoginApi({ username, password });

      // Lưu ý: Kiểm tra statusCode và code theo đúng format của Backend system-login
      if (res?.statusCode !== 200 || res?.code !== 'SUCCESS') {
        return { success: false, message: res?.message || 'Thông tin quản trị không chính xác' };
      }

      const userObj = handleAuthSuccess(res.data);
      return { success: true, user: userObj };
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi đăng nhập hệ thống quản trị.';
      return { success: false, message };
    }
  };

  // 3. Đăng ký
  const register = async ({ username, password, fullName, email, contactPhone }) => {
    try {
      const res = await registerApi({ username, password, fullName, email, contactPhone });

      if (res?.statusCode !== 200 || res?.code !== 'SUCCESS' || !res?.data) {
        return { success: false, message: res?.message || 'Đăng ký thất bại, dữ liệu không hợp lệ.' };
      }

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.';
      return { success: false, message };
    }
  };

  // 4. Đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const forgotPassword = async () => {
    return { success: true, message: 'Tính năng đang được phát triển' };
  };

  // Chuẩn hóa chuỗi Role
  const normalizedRole = user?.role?.toLowerCase() || '';

  const value = {
    user,
    login,
    systemLogin, // Đưa systemLogin vào value để AdminLogin.jsx có thể gọi
    register,
    logout,
    forgotPassword,
    loading,
    isAuthenticated: !!user,
    isCustomer: normalizedRole === 'customer',
    isEmployee: ['employee', 'staff'].includes(normalizedRole),
    isAdmin: normalizedRole === 'admin',
    isManager: normalizedRole === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};