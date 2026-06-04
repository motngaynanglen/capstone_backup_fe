import axiosInstance from './axiosInstance';

// 1. Truy vấn danh sách lịch sử biến động kho (paging, filter)
export const queryInventoryTransactionsApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory-transaction/query', payload);
  return response.data;
};

// 2. Tạo mới giao dịch kho (Nhập/Xuất/Điều chỉnh)
export const createInventoryTransactionApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory-transaction/create', payload);
  return response.data;
};

// 3. Truy vết lịch sử kho theo ReferenceId (OrderId)
export const getInventoryByOrderApi = async (orderId) => {
  const response = await axiosInstance.get(`/api/inventory-transaction/reference/${orderId}`);
  return response.data;
};

// Default export object for backward compatibility
const inventoryApi = {
  query: queryInventoryTransactionsApi,
  create: createInventoryTransactionApi,
  getByReference: getInventoryByOrderApi,
};

export default inventoryApi;
