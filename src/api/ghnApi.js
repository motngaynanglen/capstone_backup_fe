import axiosInstance from './axiosInstance';

export const getGhnProvincesApi = async () => {
  const res = await axiosInstance.get('/api/shipment/ghn/provinces');
  return res.data;
};

export const getGhnDistrictsApi = async (provinceId) => {
  const res = await axiosInstance.get('/api/shipment/ghn/districts', { params: { provinceId } });
  return res.data;
};

export const getGhnWardsApi = async (districtId) => {
  const res = await axiosInstance.get('/api/shipment/ghn/wards', { params: { districtId } });
  return res.data;
};
