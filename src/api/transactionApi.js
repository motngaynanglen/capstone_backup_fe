import axiosInstance from './axiosInstance';

const transactionApi = {
  // Gửi yêu cầu thanh toán đơn hàng
  // paymentMethod: 'PAYOS' | 'CASH'
  performTransaction: async ({ orderId, paymentMethod }) => {
    const response = await axiosInstance.post('/api/transaction/perform-transaction', {
      orderId,
      paymentMethod,
    });
    return response.data;
  },

  // Lấy thông tin giao dịch theo orderId
  getByOrderId: async (orderId) => {
    const response = await axiosInstance.get(`/api/transaction/${orderId}/detail-by-order-id`);
    return response.data;
  },

  // Hủy giao dịch
  cancel: async (transactionId, reason = '') => {
    const response = await axiosInstance.post(`/api/transaction/${transactionId}/cancel`, {
      reason,
    });
    return response.data;
  },
};

export default transactionApi;
