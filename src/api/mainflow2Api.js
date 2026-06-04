import axiosInstance from './axiosInstance';
import { uploadPublicFile, extractUploadUrl } from './fileApi';

/**
 * mainflow2Api.js — Adapter layer
 *
 * FE gốc dùng /api/mainflow-2/* nhưng controller này KHÔNG TỒN TẠI trong BE.
 * File này map sang các endpoint BE thật:
 *   - /api/design-work/*      — quản lý công việc thiết kế / in nhanh
 *   - /api/design-log/*       — chat / log
 *   - /api/design-version/*   — version history
 *   - /api/technical-draft/*  — báo giá kỹ thuật
 *   - /api/order/checkout-*   — đặt hàng dịch vụ
 *
 * Giữ nguyên tên export để các page không cần đổi import.
 */

// ─── Customer: Tạo yêu cầu thiết kế (Design Service) ───────────────────
// BE: POST /api/design-work/add
// Body: { Name, BaseImageUrl?, InitialFileUrl?, VersionTitle? }
export const createDesignRequest = async (payload) => {
  const body = {
    Name: payload.title || payload.name || payload.Name,
    BaseImageUrl: payload.initialIdeaImageUrls?.[0] || payload.baseImageUrl || null,
    InitialFileUrl: payload.initialFileUrl || null,
    VersionTitle: payload.versionTitle || 'Phiên bản đầu tiên',
  };

  // Nếu có nhiều ảnh ý tưởng, gửi ảnh đầu làm BaseImageUrl
  // Các ảnh còn lại sẽ gửi qua design-log sau
  const response = await axiosInstance.post('/api/design-work/add', body);
  const result = response.data;

  // Gửi các ảnh bổ sung qua chat log (nếu có >1 ảnh)
  const extraImages = (payload.initialIdeaImageUrls || []).slice(1);
  const designWorkId = result?.data?.id || result?.data?.Id;
  if (extraImages.length > 0 && designWorkId) {
    try {
      await axiosInstance.post('/api/design-log/createChatLog', {
        DesignWorkId: designWorkId,
        Content: 'Ảnh ý tưởng bổ sung',
        ImageUrls: extraImages,
        LogType: 'COMMUNICATION',
      });
    } catch (e) {
      console.warn('Gửi ảnh bổ sung thất bại (không ảnh hưởng yêu cầu chính):', e);
    }
  }

  return result;
};

// ─── Customer: Gửi yêu cầu in nhanh (Quick Print / Upload STL/OBJ) ────
// BE: POST /api/design-work/quick-print
// Body: { ProjectName, Description?, FileUrls: string[], Note? }
export const createCustomFilePrintRequest = async (payload) => {
  const fileUrls = [];

  // Nếu FE truyền customerFileUrl (1 file), đưa vào array
  if (payload.customerFileUrl) {
    fileUrls.push(payload.customerFileUrl);
  }
  if (payload.fileUrls) {
    fileUrls.push(...payload.fileUrls);
  }

  const body = {
    ProjectName: payload.title || payload.projectName || 'Yêu cầu in 3D',
    Description: payload.technicalRequirements || payload.description || null,
    FileUrls: fileUrls,
    Note: payload.note || null,
  };

  const response = await axiosInstance.post('/api/design-work/quick-print', body);
  return response.data;
};

// ─── Customer: Gửi AI-generated model (Quick Print variant) ─────────────
// Dùng chung quick-print, file đã upload sẵn
export const createAiPrintRequest = async (payload) => {
  const fileUrls = [];
  if (payload.modelFileUrl) fileUrls.push(payload.modelFileUrl);

  const body = {
    ProjectName: payload.title || 'Mô hình AI',
    Description: payload.prompt || null,
    FileUrls: fileUrls,
    Note: payload.note || null,
  };

  const response = await axiosInstance.post('/api/design-work/quick-print', body);
  return response.data;
};

// ─── Query danh sách design work (Customer / Staff / Manager) ───────────
// BE: POST /api/design-work/query
// Body: { Search?, Status?, PageNumber, PageSize, SortBy?, SortDescending?, WorkType?, HasUnreviewedFiles? }
export const getDesignRequests = async (params) => {
  const body = {
    PageNumber: params?.pageNumber || params?.PageNumber || 1,
    PageSize: params?.pageSize || params?.PageSize || 20,
    Search: params?.search || params?.Search || '',
    Status: params?.status || params?.Status || '',
    SortBy: params?.sortBy || 'Name',
    SortDescending: params?.sortDescending ?? false,
    WorkType: params?.workType || params?.WorkType || null,
    HasUnreviewedFiles: params?.hasUnreviewedFiles ?? null,
  };

  const response = await axiosInstance.post('/api/design-work/query', body);
  return response.data;
};

// ─── Chi tiết design work ───────────────────────────────────────────────
// BE: POST /api/design-work/query rồi filter
// (GET /{id}/detail bị comment out trong BE, dùng query thay)
export const getDesignRequestDetail = async (id) => {
  // Thử query với search = id (BE sẽ filter)
  // Hoặc dùng query all rồi find — nhưng BE không có GET detail endpoint
  // Workaround: query tất cả rồi tìm theo id
  const response = await axiosInstance.post('/api/design-work/query', {
    PageNumber: 1,
    PageSize: 1,
    Search: '',
    Status: '',
  });

  // Nếu BE trả pagination, lấy item match id
  const items = response.data?.data || [];
  const match = Array.isArray(items)
    ? items.find((item) => item.id === id || item.Id === id)
    : null;

  // Fallback: trả toàn bộ response (caller sẽ tự handle)
  if (!match) {
    // Thử lại với page lớn hơn
    const allRes = await axiosInstance.post('/api/design-work/query', {
      PageNumber: 1,
      PageSize: 100,
      Search: '',
      Status: '',
    });
    const allItems = allRes.data?.data || [];
    const found = Array.isArray(allItems)
      ? allItems.find((item) => item.id === id || item.Id === id)
      : null;
    return { data: found || null, statusCode: found ? 200 : 404 };
  }

  return { data: match, statusCode: 200 };
};

// ─── Staff: Assign vào design work ──────────────────────────────────────
// BE: PATCH /api/design-work/{id}/update  (gán AssignedStaffId)
export const assignStaffToRequest = async (id) => {
  const response = await axiosInstance.patch(`/api/design-work/${id}/update`, {
    // BE tự gán staff hiện tại khi nhận update từ Staff role
    // Hoặc có thể dùng field cụ thể nếu BE hỗ trợ
  });
  return response.data;
};

// ─── Staff: Gửi báo giá ─────────────────────────────────────────────────
// BE: POST /api/technical-draft/add
// Body: { DesignWorkId, PricePerGram?, Weight?, MaterialId?, ... }
export const submitQuote = async (id, payload) => {
  const body = {
    DesignWorkId: id,
    ...payload,
  };
  const response = await axiosInstance.post('/api/technical-draft/add', body);
  return response.data;
};

// ─── Customer: Duyệt báo giá ────────────────────────────────────────────
// BE: PATCH /api/design-work/{id}/mark-approve
export const approveQuote = async (id) => {
  const response = await axiosInstance.patch(`/api/design-work/${id}/mark-approve`, {
    IsApproved: true,
  });
  return response.data;
};

// ─── Hủy design work ────────────────────────────────────────────────────
// BE: DELETE /api/design-work/{id}/close
export const cancelDesignRequest = async (designWorkId) => {
  if (!designWorkId) {
    throw new Error('Thiếu DesignWorkId — không thể hủy yêu cầu.');
  }
  const response = await axiosInstance.delete(`/api/design-work/${designWorkId}/close`, {
    data: { Reason: 'Khách hàng hủy yêu cầu' },
  });
  return response.data;
};

// ─── Chat / Tin nhắn ─────────────────────────────────────────────────────
// BE: POST /api/design-log/createChatLog
// Body: { DesignWorkId, Content, ImageUrls?, LogType }
export const postDesignRequestMessage = async (id, payload) => {
  const body = {
    DesignWorkId: id,
    Content: payload.content || payload.Content || '',
    ImageUrls: payload.attachmentUrls || payload.imageUrls || payload.ImageUrls || [],
    LogType: 'COMMUNICATION',
  };
  const response = await axiosInstance.post('/api/design-log/createChatLog', body);
  return response.data;
};

// ─── Lấy chat logs ──────────────────────────────────────────────────────
// BE: GET /api/design-log/{designWorkId}/getLogsByWork
export const getDesignRequestMessages = async (designWorkId) => {
  const response = await axiosInstance.get(`/api/design-log/${designWorkId}/getLogsByWork`);
  return response.data;
};

// ─── Lấy version history ────────────────────────────────────────────────
// BE: GET /api/design-version/design-work/{designWorkId}
export const getDesignVersions = async (designWorkId) => {
  const response = await axiosInstance.get(`/api/design-version/design-work/${designWorkId}`);
  return response.data;
};

// ─── Upload file — dùng presigned URL flow ──────────────────────────────
// Thay thế POST /api/files/upload cũ
export const uploadFile = async (file) => {
  const result = await uploadPublicFile(file);
  const data = result?.data || result;
  return {
    data: {
      url: data?.url || data?.publicUrl,
      publicUrl: data?.publicUrl || data?.url,
      fileName: data?.fileName || file.name,
    },
  };
};

// ─── Re-upload files cho Quick Print (SKETCHING) ─────────────────────────
// BE: POST /api/design-work/{id}/add-files
export const addFilesToQuickPrint = async (designWorkId, fileUrls, note) => {
  const body = {
    FileUrls: fileUrls,
    Note: note || null,
  };
  const response = await axiosInstance.post(`/api/design-work/${designWorkId}/add-files`, body);
  return response.data;
};

// ─── Khóa design work ───────────────────────────────────────────────────
// BE: PATCH /api/design-work/{id}/lock
export const lockDesignWork = async (designWorkId) => {
  const response = await axiosInstance.patch(`/api/design-work/${designWorkId}/lock`);
  return response.data;
};

// ─── Yêu cầu chỉnh sửa (rework) ────────────────────────────────────────
// BE: POST /api/design-work/{id}/request-rework
export const requestRework = async (designWorkId, payload) => {
  const response = await axiosInstance.post(`/api/design-work/${designWorkId}/request-rework`, payload || {});
  return response.data;
};

// ─── Duyệt file kỹ thuật (Staff) ────────────────────────────────────────
// BE: POST /api/design-work/{versionHistoryId}/review-file
export const reviewFileVersion = async (versionHistoryId, payload) => {
  const response = await axiosInstance.post(`/api/design-work/${versionHistoryId}/review-file`, payload);
  return response.data;
};
