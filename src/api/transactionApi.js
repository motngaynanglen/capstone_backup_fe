import axiosInstance from './axiosInstance';

const transactionApi = {
  // Gửi yêu cầu tạo link thanh toán — BE: POST /api/transaction/perform-transaction
  performTransaction: async ({ orderId, paymentMethod }) => {
    const response = await axiosInstance.post('/api/transaction/perform-transaction', {
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

  // Lấy giao dịch theo orderId — BE: GET /api/transaction/{orderId}/detail-by-order-id
  getByOrderId: async (orderId) => {
    const response = await axiosInstance.get(`/api/transaction/${orderId}/detail-by-order-id`);
    return response.data;
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
