import axiosInstance from './axiosInstance';
import { MATERIAL_INVENTORY_ENDPOINTS } from './endpoints';

const materialInventoryApi = {
  create: async (data) => {
    const response = await axiosInstance.post(MATERIAL_INVENTORY_ENDPOINTS.CREATE, data);
    return response.data;
  },
};

export default materialInventoryApi;
