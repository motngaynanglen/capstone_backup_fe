import axiosInstance from './axiosInstance';

const technicalDraftApi = {
  // Lấy danh sách draft của customer đang login (BE mới: /my-drafts)
  getMyConfirmed: async () => {
    const response = await axiosInstance.get('/api/technical-draft/my-drafts');
    return response.data;
  },

  getMyDrafts: async (params = {}) => {
    const response = await axiosInstance.get('/api/technical-draft/my-drafts', { params });
    return response.data;
  },

  getByVersion: async (versionId) => {
    const response = await axiosInstance.get(`/api/technical-draft/version/${versionId}`);
    return response.data;
  },

  getByDesignWork: async (designWorkId) => {
    const response = await axiosInstance.get(`/api/technical-draft/design-work/${designWorkId}`);
    return response.data;
  },

  // Lấy chi tiết một draft
  getDetail: async (id) => {
    const response = await axiosInstance.get(`/api/technical-draft/${id}/detail`);
    return response.data;
  },

  // Tạo draft mới (staff)
  create: async (data) => {
    const response = await axiosInstance.post('/api/technical-draft/', data);
    return response.data;
  },

  // Cập nhật draft (staff, chỉ khi chưa confirmed)
  update: async (id, data) => {
    const response = await axiosInstance.patch(`/api/technical-draft/${id}/update`, data);
    return response.data;
  },

  // Xóa draft (soft-delete, chỉ khi chưa confirmed)
  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/technical-draft/${id}/delete`);
    return response.data;
  },
};

export default technicalDraftApi;
