import axiosInstance from './axiosInstance';

export const MAINFLOW2_ENDPOINTS = {
  BASE: '/api/mainflow-2/design-requests',
};

// Customer: Create a new design request (mô tả + ảnh ý tưởng)
export const createDesignRequest = async (payload) => {
  // payload: { title, requirementBrief, initialIdeaImageUrls: [] }
  const response = await axiosInstance.post(MAINFLOW2_ENDPOINTS.BASE, payload);
  return response.data;
};

// Luồng 2: Khách upload STL/OBJ → KTV báo giá
export const createCustomFilePrintRequest = async (payload) => {
  // payload: { title, customerFileUrl, materialId?, technicalRequirements?, note? }
  const response = await axiosInstance.post('/api/mainflow-2/print-requests', payload);
  return response.data;
};

// Luồng 3: Khách gửi GLB từ AI → KTV báo giá
export const createAiPrintRequest = async (payload) => {
  // payload: { title?, modelFileUrl, sourceImageUrl?, prompt? }
  const response = await axiosInstance.post('/api/mainflow-2/ai-print-requests', payload);
  return response.data;
};

// Customer / Staff / Manager: Fetch list of requests with paging & filtering
export const getDesignRequests = async (params) => {
  // params: { pageNumber, pageSize, status }
  const response = await axiosInstance.get(MAINFLOW2_ENDPOINTS.BASE, { params });
  return response.data;
};

// Customer / Staff / Manager: Fetch design request details
export const getDesignRequestDetail = async (id) => {
  const response = await axiosInstance.get(`${MAINFLOW2_ENDPOINTS.BASE}/${id}`);
  return response.data;
};

// Staff: Assign oneself to a request
export const assignStaffToRequest = async (id) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/staff/assign`, {});
  return response.data;
};

// Staff: Provide a detailed quote (material + grams + labor) or flat price
export const submitQuote = async (id, payload) => {
  // payload: { quotedPrice, currency, staffNote, laborCost?, components?, designFileUrls? }
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/staff/quote`, payload);
  return response.data;
};

// Customer: Approve the quote
export const approveQuote = async (id) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/approve`, {});
  return response.data;
};

// Customer / Staff / Manager: Cancel the request
export const cancelDesignRequest = async (id) => {
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/cancel`, {});
  return response.data;
};

// Post a message in the thread
export const postDesignRequestMessage = async (id, payload) => {
  // payload: { content, attachmentUrls: [] }
  const response = await axiosInstance.post(`${MAINFLOW2_ENDPOINTS.BASE}/${id}/messages`, payload);
  return response.data;
};

// Upload a file (images, GLB, OBJ, STL, etc.)
// Returns: { url, publicUrl }
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
