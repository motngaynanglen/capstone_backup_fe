import axiosInstance from './axiosInstance';

/** Bàn làm việc KTV — một API tổng hợp từ DB (GET /api/staff/workbench). */
export const getStaffWorkbenchApi = async () => {
  const response = await axiosInstance.get('/api/staff/workbench');
  return response.data;
};
