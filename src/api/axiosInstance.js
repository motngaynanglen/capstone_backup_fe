import axios from "axios";

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const url = error.config?.url || "";
    const status = error.response?.status;
    const isLoginApi = url.includes("/login");

    if (status === 401) {
      if (!isLoginApi) {
        console.warn("Token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else {
        console.warn("Đăng nhập thất bại.");
      }
    }

    if (status === 403) {
      console.error("Bạn không có quyền truy cập vào chức năng này.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
