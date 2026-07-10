import axiosInstance from './axiosInstance';

export const MAINFLOW2_ENDPOINTS = {
  BASE: '/api/mainflow-2/design-requests',
};

export const CUSTOM_PRINT_SOURCE_TYPES = new Set([
  'CUSTOM_FILE_PRINT_MF2',
  'CUSTOM_QUOTE_MF2',
  'AI_GENERATED',
  'PRINT_FROM_DESIGN_MF2',
  'REPRINT_MF2',
]);

export const isCustomPrintSourceType = (sourceType) =>
  CUSTOM_PRINT_SOURCE_TYPES.has(String(sourceType || '').toUpperCase());

export const isReprintSourceType = (sourceType) =>
  String(sourceType || '').toUpperCase() === 'REPRINT_MF2';

/** Flow 2 in sẵn/in lại + Flow 3 AI — thanh toán FULL sau báo giá, không cọc/thiết kế. */
export const DIRECT_PRINT_SOURCE_TYPES = new Set([
  'REPRINT_MF2',
  'PRINT_FROM_DESIGN_MF2',
  'AI_GENERATED',
]);

export const isDirectPrintSourceType = (sourceType) =>
  DIRECT_PRINT_SOURCE_TYPES.has(String(sourceType || '').toUpperCase());

// Customer: Create a new design request (mô tả + ảnh ý tưởng)
export const createDesignRequest = async (payload) => {
  const response = await axiosInstance.post(MAINFLOW2_ENDPOINTS.BASE, payload);
  return response.data;
};

// TH1: Khách upload STL/OBJ/GLB → KTV báo giá
export const createCustomFilePrintRequest = async (payload) => {
  const response = await axiosInstance.post('/api/mainflow-2/print-requests', payload);
  return response.data;
};

// AI: Khách gửi GLB từ AI → KTV báo giá
export const createAiPrintRequest = async (payload) => {
  const response = await axiosInstance.post('/api/mainflow-2/ai-print-requests', payload);
  return response.data;
};

// TH2: In từ thiết kế đã thanh toán trên hệ thống
export const createPrintFromDesign = async (payload) => {
  const response = await axiosInstance.post('/api/mainflow-2/print-from-design', payload);
  return response.data;
};

// TH3: In lại đơn custom đã có báo giá
export const createReprintRequest = async (payload) => {
  const response = await axiosInstance.post('/api/mainflow-2/reprint-requests', payload);
  return response.data;
};

export const getPrintableDesigns = async () => {
  const response = await axiosInstance.get('/api/mainflow-2/printable-designs');
  return response.data;
};

export const getReprintableOrders = async () => {
  const response = await axiosInstance.get('/api/mainflow-2/reprintable-orders');
  return response.data;
};

export const getMainflow2StaffList = async () => {
  const response = await axiosInstance.get('/api/mainflow-2/staff-list');
  return response.data;
};

export const getDesignRequests = async (params) => {
  const response = await axiosInstance.get(MAINFLOW2_ENDPOINTS.BASE, { params });
  return response.data;
};

export const getDesignRequestDetail = async (id) => {
  const response = await axiosInstance.get(`${MAINFLOW2_ENDPOINTS.BASE}/${id}`);
  return response.data;
};

export const assignStaffToRequest = async (id) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/staff/assign`, {});
  return response.data;
};

export const managerAssignStaff = async (id, staffId) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/manager/assign`, { staffId });
  return response.data;
};

export const submitQuote = async (id, payload) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/staff/quote`, payload);
  return response.data;
};

export const approveQuote = async (id) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/approve`, {});
  return response.data;
};

export const completeDesign = async (id, { deliverableFileUrl, note } = {}) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/staff/complete-design`, {
    deliverableFileUrl,
    note,
  });
  return response.data;
};

export const cancelDesignRequest = async (designWorkId) => {
  if (!designWorkId) {
    throw new Error('Thiếu DesignWorkId — không thể hủy yêu cầu.');
  }
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${designWorkId}/cancel`, {});
  return response.data;
};

export const postDesignRequestMessage = async (id, payload) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/messages`, payload);
  return response.data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return response.data;
};
