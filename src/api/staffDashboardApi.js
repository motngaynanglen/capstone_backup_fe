import axiosInstance from './axiosInstance';

/** Bàn làm việc KTV — BE: GET /api/dashboard/staff */
export const getStaffWorkbenchApi = async () => {
  const response = await axiosInstance.get('/api/dashboard/staff');
  return response.data;
};

/** Tóm tắt — BE: GET /api/dashboard/staff/summary */
export const getStaffSummaryApi = async () => {
  const response = await axiosInstance.get('/api/dashboard/staff/summary');
  return response.data;
};

/** Hàng đợi công việc — BE: GET /api/dashboard/staff/work-queue */
export const getStaffWorkQueueApi = async () => {
  const response = await axiosInstance.get('/api/dashboard/staff/work-queue');
  return response.data;
};

/** Công việc gần đây — BE: GET /api/dashboard/staff/recent-work */
export const getStaffRecentWorkApi = async () => {
  const response = await axiosInstance.get('/api/dashboard/staff/recent-work');
  return response.data;
};
