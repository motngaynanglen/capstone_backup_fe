import axiosInstance from './axiosInstance';

/**
 * Manager dashboard — gọi các endpoint dashboard sẵn có của BE.
 * Trả về `response.data` = BaseResponseModel { statusCode, code, data, message }.
 */

// Tổng quan: status counts + revenue + action items + low stock + recent orders.
export const getManagerDashboardApi = async () => {
  const res = await axiosInstance.get('/api/dashboard/manager');
  return res.data;
};

// Biểu đồ doanh thu theo ngày/tháng.
export const getRevenueChartApi = async ({ from, to, groupBy = 'day' } = {}) => {
  const res = await axiosInstance.get('/api/dashboard/manager/charts/revenue', {
    params: { from, to, groupBy },
  });
  return res.data;
};

// Biểu đồ đơn hàng theo loại nguồn (IN_STOCK / PRE_ORDER / DESIGN_SERVICE / PRINT_SERVICE...).
export const getOrdersBySourceTypeChartApi = async ({ from, to } = {}) => {
  const res = await axiosInstance.get('/api/dashboard/manager/charts/orders-by-source-type', {
    params: { from, to },
  });
  return res.data;
};

// Biểu đồ top sản phẩm/biến thể bán chạy.
export const getTopVariantsChartApi = async ({ from, to, limit = 8 } = {}) => {
  const res = await axiosInstance.get('/api/dashboard/manager/charts/top-variants', {
    params: { from, to, limit },
  });
  return res.data;
};
