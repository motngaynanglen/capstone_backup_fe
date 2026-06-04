import axiosInstance from './axiosInstance';

// 1. Truy vấn danh sách vận đơn (search, filter, paging)
export const queryShipmentsApi = async (payload) => {
  const response = await axiosInstance.post('/api/shipment/query', payload);
  return response.data;
};

// 2. Lấy chi tiết vận đơn theo ID
export const getShipmentDetailApi = async (id) => {
  const response = await axiosInstance.get(`/api/shipment/${id}/detail`);
  return response.data;
};

// 3. Lấy chi tiết vận đơn theo Order ID
export const getShipmentByOrderApi = async (orderId) => {
  const response = await axiosInstance.get(`/api/shipment/${orderId}/detail-by-order-id`);
  return response.data;
};

// 4. Cập nhật thông tin vận đơn
export const updateShipmentApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/update`, payload);
  return response.data;
};

// 5. Báo phí GHN
export const getShippingQuotesApi = async (payload) => {
  const response = await axiosInstance.post('/api/shipment/quotes', payload);
  return response.data;
};

// 6. [Staff/Manager] Tạo vận đơn GHN
export const createCarrierShipmentApi = async (orderId, payload) => {
  const response = await axiosInstance.post(
    `/api/shipment/order/${orderId}/create-carrier`,
    payload,
  );
  return response.data;
};

export const CARRIER_LABELS = {
  GHN: 'Giao Hàng Nhanh (GHN)',
  MANUAL: 'Tự giao / thủ công',
};
