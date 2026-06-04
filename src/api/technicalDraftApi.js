import axiosInstance from './axiosInstance';

const technicalDraftApi = {
  // Lấy danh sách draft (dùng query vì BE không có /my-drafts)
  // BE: POST /api/technical-draft/query
  getMyConfirmed: async () => {
    const response = await axiosInstance.post('/api/technical-draft/query', {
      isConfirmed: true,
      pageSize: 100,
    });
    return response.data;
  },

  getMyDrafts: async (params = {}) => {
    const response = await axiosInstance.post('/api/technical-draft/query', {
      pageSize: 100,
      ...params,
    });
    return response.data;
  },

  getByDesignWork: async (designWorkId) => {
    const response = await axiosInstance.post('/api/technical-draft/query', {
      designWorkId,
      pageSize: 50,
    });
    return response.data;
  },

  // Lấy chi tiết một draft
  getDetail: async (id) => {
    const response = await axiosInstance.get(`/api/technical-draft/${id}/detail`);
    return response.data;
  },

  // Tạo draft mới (staff) — BE: POST /api/technical-draft/add
  create: async (data) => {
    const response = await axiosInstance.post('/api/technical-draft/add', data);
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
