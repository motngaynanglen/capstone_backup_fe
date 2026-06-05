import axiosInstance from './axiosInstance';

const technicalDraftApi = {
  // BE: GET /api/technical-draft/my-drafts
  getMyConfirmed: async (params = {}) => {
    const response = await axiosInstance.get('/api/technical-draft/my-drafts', {
      params: {
        isConfirmed: true,
        pageSize: 100,
        ...params,
      },
    });
    return response.data;
  },

  // BE: GET /api/technical-draft/my-drafts
  getMyDrafts: async (params = {}) => {
    const response = await axiosInstance.get('/api/technical-draft/my-drafts', {
      params: {
        pageSize: 100,
        ...params,
      },
    });
    return response.data;
  },

  // BE: GET /api/technical-draft/design-work/{designWorkId}
  getByDesignWork: async (designWorkId) => {
    const response = await axiosInstance.get(`/api/technical-draft/design-work/${designWorkId}`);
    return response.data;
  },

  // BE: GET /api/technical-draft/version/{versionId}
  getByVersion: async (versionId) => {
    const response = await axiosInstance.get(`/api/technical-draft/version/${versionId}`);
    return response.data;
  },

  // BE: GET /api/technical-draft/{id}/detail
  getDetail: async (id) => {
    const response = await axiosInstance.get(`/api/technical-draft/${id}/detail`);
    return response.data;
  },

  // BE: PATCH /api/technical-draft/{id}/confirm
  confirm: async (id) => {
    const response = await axiosInstance.patch(`/api/technical-draft/${id}/confirm`);
    return response.data;
  },

  // BE: POST /api/technical-draft
  create: async (data) => {
    const response = await axiosInstance.post('/api/technical-draft', data);
    return response.data;
  },

  // BE: PATCH /api/technical-draft/{id}/update
  update: async (id, data) => {
    const response = await axiosInstance.patch(`/api/technical-draft/${id}/update`, data);
    return response.data;
  },

  // BE: DELETE /api/technical-draft/{id}/delete
  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/technical-draft/${id}/delete`);
    return response.data;
  },
};

export default technicalDraftApi;
