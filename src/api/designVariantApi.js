import axiosInstance from './axiosInstance';
import { DESIGN_VARIANT_ENDPOINTS } from './endpoints';

const designVariantApi = {
  getDetail: async (id) => {
    try {
      const response = await axiosInstance.get(`${DESIGN_VARIANT_ENDPOINTS.DETAIL}/${id}/detail`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Query all variants with filtering
  getAll: async (params) => {
    try {
      // API expects { designTemplateId, materialId, isActive }
      const response = await axiosInstance.post(DESIGN_VARIANT_ENDPOINTS.SEARCH, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add new variant
  add: async (data) => {
    try {
      const response = await axiosInstance.post(DESIGN_VARIANT_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update variant
  update: async (data) => {
    try {
      const id = data?.id;
      if (!id) throw new Error('Thiếu id biến thể');
      const response = await axiosInstance.put(`${DESIGN_VARIANT_ENDPOINTS.UPDATE}/${id}/update`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add stock quantity
  addQuantity: async (data) => {
    try {
      const id = data?.id;
      if (!id) throw new Error('Thiếu id biến thể');
      const response = await axiosInstance.put(`${DESIGN_VARIANT_ENDPOINTS.UPDATE_QUANTITY}/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  toggleActive: async (id) => {
    try {
      const response = await axiosInstance.delete(`${DESIGN_VARIANT_ENDPOINTS.TOGGLE_ACTIVE}/${id}/toggle-active`, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Backward-compatible alias
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`${DESIGN_VARIANT_ENDPOINTS.DELETE}/${id}/delete`, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default designVariantApi;
