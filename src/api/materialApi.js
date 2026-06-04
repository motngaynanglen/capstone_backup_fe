import axiosInstance from './axiosInstance';
import { MATERIAL_ENDPOINTS } from './endpoints';

const materialApi = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(MATERIAL_ENDPOINTS.GET_ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDetail: async (id) => {
    try {
      const response = await axiosInstance.get(`${MATERIAL_ENDPOINTS.DETAIL}/${id}/detail`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  add: async (data) => {
    try {
      const response = await axiosInstance.post(MATERIAL_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosInstance.put(`${MATERIAL_ENDPOINTS.UPDATE}/${id}/update`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  toggleActive: async (id) => {
    try {
      const response = await axiosInstance.delete(`${MATERIAL_ENDPOINTS.TOGGLE_ACTIVE}/${id}/toggle-active`, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Kích hoạt vật liệu (yêu cầu phải có giá hiện hành)
  activate: async (id) => {
    const response = await axiosInstance.patch(`/api/material/${id}/active`);
    return response.data;
  },

  // Vô hiệu hóa vật liệu
  deactivate: async (id) => {
    const response = await axiosInstance.patch(`/api/material/${id}/deactive`);
    return response.data;
  },

  // Cập nhật giá vật liệu (tạo bản ghi giá mới, đồng bộ variant)
  updatePrice: async (id, data) => {
    const response = await axiosInstance.post(`/api/material/${id}/update-price`, data);
    return response.data;
  },

  // Lấy lịch sử giá
  getPriceHistory: async (id) => {
    const response = await axiosInstance.get(`/api/material/${id}/price-history`);
    return response.data;
  },

  // Ước tính giá sản phẩm từ vật liệu
  estimateCost: async (id, params) => {
    const response = await axiosInstance.get(`/api/material/${id}/estimate-cost`, { params });
    return response.data;
  },

  // Xóa vật liệu (soft-delete)
  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/material/${id}/delete`);
    return response.data;
  },
};

export default materialApi;
