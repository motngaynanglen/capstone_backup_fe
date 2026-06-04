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

  // Query all variants with filtering — BE: POST /api/design-variant/query
  getAll: async (params) => {
    try {
      const response = await axiosInstance.post(DESIGN_VARIANT_ENDPOINTS.SEARCH, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add new variant — BE: POST /api/design-variant/add
  add: async (data) => {
    try {
      const response = await axiosInstance.post(DESIGN_VARIANT_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update variant — BE: PATCH /api/design-variant/{id}/update
  update: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`${DESIGN_VARIANT_ENDPOINTS.UPDATE}/${id}/update`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete variant — BE: DELETE /api/design-variant/{id}/delete
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
