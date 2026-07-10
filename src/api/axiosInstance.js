import axios from "axios";

export const axiosInstance = axios.create({
  // Tự động lấy URL từ file .env
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// THÊM TOKEN VÀO MỌI REQUEST
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// XỬ LÝ LỖI TRẢ VỀ TỪ BACKEND
axiosInstance.interceptors.response.use(
  (response) => {
    // Nếu gọi API thành công, trả thẳng data ra cho gọn
    return response;
  },
  (error) => {
    // 1. Kiểm tra xem API đang gọi có phải là API Login không?
    // Dùng tùy chọn an toàn (?.) để tránh lỗi crash web nếu config rỗng
    const isAuthApi = /\/auth\/(login|system-login)/.test(error.config?.url || '');

    // 2. Bắt lỗi 401: Unauthorized
    if (error.response && error.response.status === 401) {
      // CHỐT CHẶN: Chỉ đá về trang đăng nhập nếu KHÔNG PHẢI đang gọi API Login
      if (!isAuthApi) {
        console.warn(
          "Token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!"
        );

        // Xóa sạch rác trong LocalStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Tự động đá người dùng về trang đăng nhập
        window.location.href = "/login";
      } else {
        // Ghi log nhẹ nhàng, nhường lại cho file Login.jsx hiện chữ đỏ
        console.warn("Đăng nhập thất bại (Sai tài khoản hoặc mật khẩu).");
      }
    }

    // 3. Bắt lỗi 403: Forbidden (Đăng nhập rồi nhưng không có quyền)
    if (error.response && error.response.status === 403) {
      console.error("Bạn không có quyền truy cập vào chức năng này!");
      // Tùy nhu cầu, bạn có thể redirect về trang 403 hoặc alert ra màn hình
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
