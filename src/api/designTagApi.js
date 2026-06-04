import axiosInstance from './axiosInstance';
import { DESIGN_TAG_ENDPOINTS } from './endpoints';

const designTagApi = {
  getTags: async (templateId) => {
    try {
      const url = `${DESIGN_TAG_ENDPOINTS.GET_TAGS}/${templateId}/tags`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  syncTags: async (data) => {
    try {
      const response = await axiosInstance.post(DESIGN_TAG_ENDPOINTS.SYNC, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addTag: async (data) => {
    try {
      const response = await axiosInstance.post(DESIGN_TAG_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMainTag: async (id, isMainTag) => {
    try {
      const url = `${DESIGN_TAG_ENDPOINTS.UPDATE}/${id}`;
      const response = await axiosInstance.put(url, { id, isMainTag });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      const url = `${DESIGN_TAG_ENDPOINTS.DELETE}/${id}`;
      const response = await axiosInstance.delete(url, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default designTagApi;
