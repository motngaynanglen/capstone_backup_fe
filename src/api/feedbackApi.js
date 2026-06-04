import axiosInstance from './axiosInstance';

const feedbackApi = {
  // Customer: gửi đánh giá mới cho 1 OrderItem
  // payload: { orderItemId, rating, comment, imageUrls?: [] }
  send: async (payload) => {
    const response = await axiosInstance.post('/api/feedback/send', payload);
    return response.data;
  },

  // Customer: danh sách OrderItem đã nhận nhưng chưa đánh giá
  myPending: async (params = {}) => {
    const response = await axiosInstance.post('/api/feedback/my-pending', params);
    return response.data;
  },

  // Customer: các đánh giá đã gửi
  myHistory: async (params = {}) => {
    const response = await axiosInstance.post('/api/feedback/my-history', params);
    return response.data;
  },

  // Public: feedback theo design template
  byTemplate: async (templateId, params = {}) => {
    const response = await axiosInstance.post(`/api/feedback/template/${templateId}`, params);
    return response.data;
  },

  // Lấy danh sách feedback (Manager/Staff) - có phân trang và search
  query: async (params) => {
    // params: { search, pageNumber, pageSize }
    const response = await axiosInstance.post('/api/feedback/query', params);
    return response.data;
  },

  // Phản hồi 1 feedback
  reply: async (id, replyContent) => {
    const response = await axiosInstance.patch(`/api/feedback/${id}/reply`, { replyContent });
    return response.data;
  },

  // Ẩn/hiện feedback (nếu vi phạm)
  toggleStatus: async (id) => {
    const response = await axiosInstance.patch(`/api/feedback/${id}/toggle-status`, {});
    return response.data;
  },

  // Xóa feedback
  delete: async (id) => {
    const response = await axiosInstance.patch(`/api/feedback/${id}/delete`, {});
    return response.data;
  },
};

export default feedbackApi;
