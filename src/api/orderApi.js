import axiosInstance from './axiosInstance';

// 1. Truy vấn danh sách đơn hàng (search, filter, paging)
export const queryOrdersApi = async (payload) => {
  const response = await axiosInstance.post('/api/order/query', payload);
  return response.data;
};

// 2. Lấy chi tiết đơn hàng
export const getOrderDetailApi = async (id) => {
  const response = await axiosInstance.get(`/api/order/${id}/detail`);
  return response.data;
};

// 3. Hủy đơn hàng
export const cancelOrderApi = async (id, reason = '') => {
  const response = await axiosInstance.patch(`/api/order/${id}/cancel`, { reason });
  return response.data;
};

// 4. Tạo đơn hàng (checkout)
export const checkoutOrderApi = async (payload) => {
  const response = await axiosInstance.post('/api/order/checkout', payload);
  return response.data;
};

// 5. Tạo link thanh toán — BE: POST /api/transaction/create-payment-link
export const performTransactionApi = async (payload) => {
  const response = await axiosInstance.post('/api/transaction/create-payment-link', payload);
  return response.data;
};

/** [Staff] Hàng đợi sản xuất tạm lấy từ Order query vì BE đã bỏ endpoint production-queue. */
export const getProductionQueueApi = async (payload) => {
  const response = await axiosInstance.post('/api/order/query', {
    pageNumber: payload?.pageNumber ?? 1,
    pageSize: payload?.pageSize ?? 200,
    search: payload?.search,
    status: 'PROCESSING',
    sortDescending: true,
    sortBy: 'created',
  });
  return response.data;
};

/** [Staff] Hoàn tất/đóng gói một dòng hàng theo endpoint BE mới. */
export const updateOrderItemFulfillmentApi = async (orderItemId) => {
  const response = await axiosInstance.patch(`/api/order/item/${orderItemId}/finish-package`);
  return response.data;
};

/** [Customer/Staff/Manager] Hoàn tất vòng đời đơn hàng. */
export const completeOrderApi = async (id) => {
  const response = await axiosInstance.patch(`/api/order/${id}/complete`);
  return response.data;
};

// 8. Checkout dịch vụ thiết kế (Custom Design — chọn ServiceOption)
export const checkoutDesignApi = async (payload) => {
  const response = await axiosInstance.post('/api/order/checkout-design', payload);
  return response.data;
};

// 9. Checkout đặt in từ TechnicalDraft (Print on Demand)
export const checkoutDraftsApi = async (payload) => {
  const response = await axiosInstance.post('/api/order/checkout-draft', payload);
  return response.data;
};
