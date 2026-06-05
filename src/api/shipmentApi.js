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

export const createShipmentApi = async (payload) => {
  const response = await axiosInstance.patch('/api/shipment/Add', payload);
  return response.data;
};

export const markShipmentReadyApi = async (id) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/mark-ready`);
  return response.data;
};

// BE: PATCH /api/shipment/{id}/mark-in-transit
export const markShipmentInTransitApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/mark-in-transit`, payload);
  return response.data;
};

// BE: PATCH /api/shipment/{id}/confirm-delivered
export const confirmShipmentDeliveredApi = async (id) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/confirm-delivered`);
  return response.data;
};

export const cancelShipmentApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/cancel`, payload);
  return response.data;
};

export const markShipmentFailedApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/mark-failed`, payload);
  return response.data;
};

export const markShipmentReturningApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/mark-returning`, payload);
  return response.data;
};

export const confirmShipmentReturnedApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/confirm-returned`, payload);
  return response.data;
};

export const markShipmentLostOrDamagedApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/${id}/mark-lost-or-damaged`, payload);
  return response.data;
};

export const requestShipmentAddressChangeApi = async (id, payload) => {
  const response = await axiosInstance.post(`/api/shipment/${id}/address-change-requests`, payload);
  return response.data;
};

export const approveShipmentAddressChangeApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/address-change-requests/${id}/approve`, payload);
  return response.data;
};

export const rejectShipmentAddressChangeApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/shipment/address-change-requests/${id}/reject`, payload);
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
