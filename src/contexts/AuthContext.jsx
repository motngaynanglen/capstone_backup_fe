import React, { createContext, useState, useContext, useEffect } from 'react';
// Import thêm systemLoginApi
import { loginApi, registerApi, systemLoginApi } from '../api/authApi';
import { getApiErrorMessage, parseApiFieldErrors } from '../utils/apiErrorMessage';
import { REGISTER_API_FIELD_MAP } from '../utils/registerValidation';

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

  // 1. Đăng nhập (Customer trước, fallback system-login cho Admin/Manager/Staff)
  const login = async (username, password) => {
    const normalizedUsername = username?.trim();
    if (!normalizedUsername || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' };
    }

    try {
      const res = await loginApi({ username: normalizedUsername, password });

      if (res?.statusCode !== 200 || res?.code !== 'SUCCESS') {
        return trySystemLogin(normalizedUsername, password, res?.message);
      }

      const userObj = handleAuthSuccess(res.data);
      return { success: true, user: userObj };
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        return trySystemLogin(normalizedUsername, password);
      }

      const message = getApiErrorMessage(error, {
        401: 'Tài khoản hoặc mật khẩu không chính xác',
        422: 'Dữ liệu đăng nhập không hợp lệ',
        default: 'Không thể đăng nhập. Vui lòng thử lại sau.',
      });
      return { success: false, message };
    }
  };

  const trySystemLogin = async (username, password, fallbackMessage) => {
    const systemResult = await systemLogin(username, password);
    if (systemResult.success) return systemResult;
    return {
      success: false,
      message: fallbackMessage || systemResult.message || 'Tài khoản hoặc mật khẩu không chính xác',
    };
  };

  // 2. Đăng nhập Hệ thống (Admin / Manager / Staff) — gọi trực tiếp khi cần
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
      const message = getApiErrorMessage(error, {
        401: 'Thông tin quản trị không chính xác',
        403: 'Bạn không có quyền truy cập khu vực quản trị',
        422: 'Dữ liệu đăng nhập không hợp lệ',
        default: 'Không thể đăng nhập hệ thống quản trị',
      });
      return { success: false, message };
    }
  };

  // 3. Đăng ký
  const register = async ({ username, password, fullName, email, contactPhone }) => {
    try {
      const res = await registerApi({ username, password, fullName, email, contactPhone });

      if (res?.statusCode !== 200 || res?.code !== 'SUCCESS' || !res?.data) {
        return {
          success: false,
          message: res?.message || 'Đăng ký thất bại, dữ liệu không hợp lệ.',
          fieldErrors: {},
        };
      }

      return { success: true };
    } catch (error) {
      const fieldErrors = parseApiFieldErrors(error, REGISTER_API_FIELD_MAP);
      const message = getApiErrorMessage(error, {
        422: 'Dữ liệu đăng ký không hợp lệ',
        default: 'Không thể đăng ký. Vui lòng thử lại sau.',
      });
      return { success: false, message, fieldErrors };
    }
  };

  // 4. Cập nhật thông tin user trong phiên đăng nhập (đồng bộ header, sidebar, ...)
  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // 5. Đăng xuất
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
    updateUser,
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