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

// 5. Thực hiện thanh toán đơn hàng
export const performTransactionApi = async (payload) => {
  const response = await axiosInstance.post('/api/transaction/perform-transaction', payload);
  return response.data;
};

// 6. [Staff/Manager] Cập nhật trạng thái đơn hàng + shipment
export const updateOrderStatusApi = async (id, payload) => {
  // payload: { orderStatus, shipmentStatus?, trackingNumber?, note? }
  const response = await axiosInstance.patch(`/api/order/${id}/status`, payload);
  return response.data;
};

/** [Staff] Hàng đợi sản xuất (flow 2/3, pre-order đã TT). */
export const getProductionQueueApi = async (payload) => {
  const response = await axiosInstance.post('/api/order/production-queue', payload);
  return response.data;
};

/** [Staff] Cập nhật FulfillmentStatus dòng hàng (PRINTING → FINISHED). */
export const updateOrderItemFulfillmentApi = async (orderItemId, payload) => {
  const response = await axiosInstance.patch(
    `/api/order/items/${orderItemId}/fulfillment`,
    payload,
  );
  return response.data;
};