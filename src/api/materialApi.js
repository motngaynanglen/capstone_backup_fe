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
};

export default materialApi;
