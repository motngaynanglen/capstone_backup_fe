import axiosInstance from './axiosInstance';

export const getManagerDashboardApi = async () => {
  const response = await axiosInstance.get('/api/manager/dashboard');
  return response.data;
};

export default { getManagerDashboardApi };
