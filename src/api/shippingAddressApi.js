import axiosInstance from './axiosInstance';

const shippingAddressApi = {
  // Lấy danh sách địa chỉ của tôi
  getMyAddresses: async () => {
    try {
      const response = await axiosInstance.get('/api/shipping-address/my');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thêm địa chỉ giao hàng mới
  add: async (data) => {
    try {
      const response = await axiosInstance.post('/api/shipping-address/add', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật địa chỉ
  update: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`/api/shipping-address/${id}/update`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Xóa địa chỉ
  remove: async (id) => {
    try {
      const response = await axiosInstance.delete(`/api/shipping-address/${id}/remove`, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default shippingAddressApi;
