import axiosInstance from './axiosInstance';
import { DESIGN_TEMPLATE_ENDPOINTS } from './endpoints';

const designTemplateApi = {
  query: async (params) => {
    try {
      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.QUERY, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mẫu thiết kế + danh sách biến thể (một request) — dùng cho trang quản lý sản phẩm.
   * BE: POST /api/design-template/query (đã include Variants + Tags)
   *
   * FE gọi với: { pageNumber, pageSize, search, includeInactive, conceptTagId }
   * BE nhận:    { PageNumber, PageSize, Search, IsActive, CatalogStatus, SortBy, SortDescending }
   */
  manageCatalog: async (params) => {
    try {
      const body = {
        PageNumber: params.pageNumber || 1,
        PageSize: params.pageSize || 10,
        Search: params.search || '',
        SortBy: params.sortBy || 'created',
        SortDescending: params.sortDescending ?? true,
      };

      // includeInactive=true → xem tất cả (không filter IsActive, không filter CatalogStatus)
      // includeInactive=false → chỉ xem active/published
      if (!params.includeInactive) {
        body.CatalogStatus = 'PUBLISHED';
      }

      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.QUERY, body);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDetail: async (id) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.DETAIL}/${id}/detail`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /** BE không có GET /tags/{tagId} — dùng query rồi FE filter theo tag */
  getTemplatesByTag: async (tagId) => {
    try {
      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.QUERY, {
        PageNumber: 1,
        PageSize: 100,
        SortBy: 'created',
        SortDescending: true,
      });
      // Filter client-side theo tag (BE query chưa hỗ trợ filter theo conceptTagId)
      const items = response.data?.data || [];
      if (tagId && Array.isArray(items)) {
        const filtered = items.filter((t) =>
          (t.designTags || t.tags || []).some(
            (dt) => dt.conceptTagId === tagId || dt.id === tagId
          )
        );
        return { ...response.data, data: filtered };
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  add: async (data) => {
    try {
      const response = await axiosInstance.post(DESIGN_TEMPLATE_ENDPOINTS.ADD, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // BE dùng PATCH (partial update)
  update: async (id, data) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.UPDATE}/${id}/update`;
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const url = `${DESIGN_TEMPLATE_ENDPOINTS.DELETE}/${id}/delete`;
      const response = await axiosInstance.delete(url, { data: {} });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default designTemplateApi;
