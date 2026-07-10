import axiosInstance from './axiosInstance';
import { CONCEP_TAG_ENDPOINTS } from './endpoints';

const conceptTagApi = {
  getAll: async () => {
    try {
      // promise:
      // 1. diễn ra và có kết quả trong tương lai
      // 2. Có nhiều trạng thái: pending, fulfilled, rejected
      const response = await axiosInstance.get(CONCEP_TAG_ENDPOINTS.GET_ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  query: async (data) => {
    try {
      const response = await axiosInstance.post(CONCEP_TAG_ENDPOINTS.QUERY, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  add: async (data) => {
    try {
      const response = await axiosInstance.post(CONCEP_TAG_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const url = `${CONCEP_TAG_ENDPOINTS.UPDATE}/${id}/update`;
      const response = await axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const url = `${CONCEP_TAG_ENDPOINTS.DELETE}/${id}`;
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default conceptTagApi;
