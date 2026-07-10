import axiosInstance from './axiosInstance';

// ==========================================
// SERVICE OPTIONS
// ==========================================

// 1. Lấy danh sách tùy chọn dịch vụ
export const getAllServiceOptionsApi = async () => {
  const response = await axiosInstance.get('/api/service-option/all');
  return response.data;
};

// 2. Tạo tùy chọn dịch vụ mới
export const createServiceOptionApi = async (payload) => {
  const response = await axiosInstance.post('/api/service-option/add', payload);
  return response.data;
};

// 3. Cập nhật tùy chọn
export const updateServiceOptionApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/service-option/${id}/update`, payload);
  return response.data;
};

// 4. Kích hoạt tùy chọn
export const activateServiceOptionApi = async (id) => {
  const response = await axiosInstance.patch(`/api/service-option/${id}/active`);
  return response.data;
};

// 5. Ngưng kích hoạt tùy chọn
export const deactivateServiceOptionApi = async (id) => {
  const response = await axiosInstance.patch(`/api/service-option/${id}/deactive`);
  return response.data;
};

// 6. Xóa tùy chọn
export const deleteServiceOptionApi = async (id) => {
  const response = await axiosInstance.delete(`/api/service-option/${id}/delete`);
  return response.data;
};

// ==========================================
// SERVICE PACKAGES
// ==========================================

// 7. Lấy danh sách gói dịch vụ
export const queryServicePackagesApi = async (payload) => {
  const response = await axiosInstance.post('/api/service-package/query', payload);
  return response.data;
};

// 8. Tạo gói mới
export const createServicePackageApi = async (payload) => {
  const response = await axiosInstance.post('/api/service-package/add', payload);
  return response.data;
};
