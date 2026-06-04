import axios from "axios";

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

const AUTH_EXPIRED_CODES = new Set(["AUTH_003", "AUTH_004"]);

function shouldInvalidateSession(error) {
  const response = error.response;
  if (response?.status !== 401) return false;

  const token = localStorage.getItem("token");
  if (!token) return false;

  const body = response.data || {};
  const code = body.code || body.Code;
  if (AUTH_EXPIRED_CODES.has(code)) return true;

  const authenticateHeader =
    response.headers?.["www-authenticate"] || response.headers?.["WWW-Authenticate"] || "";
  return /invalid_token|expired/i.test(authenticateHeader);
}

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
      if (!isLoginApi && shouldInvalidateSession(error)) {
        window.dispatchEvent(
          new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
            detail: {
              url,
              message:
                error.response?.data?.message ||
                error.response?.data?.Message ||
                "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
            },
          }),
        );
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
