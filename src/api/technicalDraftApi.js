import axiosInstance from './axiosInstance';

const technicalDraftApi = {
  // Lấy danh sách draft đã confirmed của customer đang login (Kho đồ)
  getMyConfirmed: async () => {
    const response = await axiosInstance.get('/api/technical-draft/my-confirmed');
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
    const response = await axiosInstance.put(`/api/technical-draft/${id}/update`, data);
    return response.data;
  },

  // Xóa draft (soft-delete, chỉ khi chưa confirmed)
  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/technical-draft/${id}/delete`);
    return response.data;
  },
};

export default technicalDraftApi;
