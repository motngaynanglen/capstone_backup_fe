import axiosInstance from './axiosInstance';
import { DESIGN_TEMPLATE_ENDPOINTS } from './endpoints';

const designTemplateApi = {
  query: async (params) => {
    try {
      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.QUERY, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /** Mẫu thiết kế + danh sách biến thể (một request) — dùng cho trang quản lý sản phẩm. */
  manageCatalog: async (params) => {
    try {
      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.MANAGE_CATALOG, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDetail: async (id) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.DETAIL}/${id}/detail`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTemplatesByTag: async (tagId) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.DETAIL}/tags/${tagId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  add: async (data) => {
    try {
      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.UPDATE}/${id}/update`;
      const response = await axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  toggleActive: async (id) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.TOGGLE_ACTIVE}/${id}/toggle-active`;
      const response = await axiosInstance.delete(url, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.DELETE}/${id}/delete`;
      const response = await axiosInstance.delete(url, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default designTemplateApi;
