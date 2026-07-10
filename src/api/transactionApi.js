import axiosInstance from './axiosInstance';

const transactionApi = {
  // Gửi yêu cầu thanh toán đơn hàng
  // paymentMethod: 'VNPAY' | 'CASH'
  performTransaction: async ({ orderId, paymentMethod, paymentPhase = 'FULL' }) => {
    const response = await axiosInstance.post('/api/transaction/perform-transaction', {
      orderId,
      paymentMethod,
      paymentPhase,
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
