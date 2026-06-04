import axiosInstance from './axiosInstance';

const transactionApi = {
  // Gửi yêu cầu tạo link thanh toán — BE: POST /api/transaction/create-payment-link
  performTransaction: async ({ orderId, paymentMethod }) => {
    const response = await axiosInstance.post('/api/transaction/create-payment-link', {
      orderId,
      paymentMethod,
    });
    return response.data;
  },

  // Lấy chi tiết giao dịch — BE: GET /api/transaction/{id}/detail
  getDetail: async (id) => {
    const response = await axiosInstance.get(`/api/transaction/${id}/detail`);
    return response.data;
  },

  // Lấy giao dịch theo orderId — dùng query filter
  getByOrderId: async (orderId) => {
    try {
      const response = await axiosInstance.post('/api/transaction/query', {
        orderId,
        pageNumber: 1,
        pageSize: 1,
      });
      const list = response.data?.data || [];
      return { data: list[0] || null };
    } catch {
      return { data: null };
    }
  },

  // Hủy giao dịch — BE: PATCH /api/transaction/{id}/cancel
  cancel: async (transactionId, reason = '') => {
    const response = await axiosInstance.patch(`/api/transaction/${transactionId}/cancel`, {
      reason,
    });
    return response.data;
  },
};

export default transactionApi;
