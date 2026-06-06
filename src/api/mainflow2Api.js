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
function extractResponseList(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
}

function normalizeDesignLog(log) {
  const imageUrls = log?.imageUrls || log?.ImageUrls || [];
  const metadata = log?.metadataJson
    || log?.MetadataJson
    || log?.metadata
    || log?.Metadata
    || (imageUrls.length > 0 ? JSON.stringify(imageUrls) : null);

  return {
    ...log,
    id: log?.id || log?.Id,
    designWorkId: log?.designWorkId || log?.DesignWorkId,
    accountId: log?.accountId || log?.AccountId,
    authorAccountId: log?.authorAccountId || log?.AuthorAccountId || log?.accountId || log?.AccountId,
    senderName: log?.senderName || log?.SenderName,
    avatarUrl: log?.avatarUrl || log?.AvatarUrl,
    content: log?.content ?? log?.Content ?? '',
    logType: log?.logType || log?.LogType || 'COMMUNICATION',
    created: log?.created || log?.Created || log?.createdAt || log?.CreatedAt,
    metadataJson: metadata,
    imageUrls,
    versions: log?.versions || log?.Versions || [],
    // Adjustment request fields
    adjustmentRequestStatus: log?.adjustmentRequestStatus || log?.AdjustmentRequestStatus || null,
    adjustmentDecisionNote: log?.adjustmentDecisionNote || log?.AdjustmentDecisionNote || null,
    adjustmentReviewedAt: log?.adjustmentReviewedAt || log?.AdjustmentReviewedAt || null,
    adjustmentReviewedByAccountId: log?.adjustmentReviewedByAccountId || log?.AdjustmentReviewedByAccountId || null,
    adjustmentConsumedServiceSelectionId: log?.adjustmentConsumedServiceSelectionId || log?.AdjustmentConsumedServiceSelectionId || null,
  };
}

async function getDesignWorkMessagesSafe(designWorkId) {
  try {
    const response = await axiosInstance.get(`/api/design-log/${designWorkId}/getLogsByWork`, {
      params: { pageNumber: 1, pageSize: 50 },
    });
    return extractResponseList(response.data).map(normalizeDesignLog);
  } catch (error) {
    console.warn('Khong tai duoc lich su chat design work:', error);
    return [];
  }
}

function normalizeDesignWork(work, messages = []) {
  const rawStatus = work?.status || work?.Status;
  const statusMap = {
    SKETCHING: 'SUBMITTED',
    PENDING: 'SUBMITTED',
    IN_PROGRESS: 'ASSIGNED',
    REVIEWING: 'QUOTED',
    COMPLETED: 'APPROVED',
    CANCELLED: 'CANCELLED',
  };

  // BE expose cờ IsDesignServicePaid (Status đã qua PENDING). Fallback suy từ rawStatus.
  const designServicePaid = work?.isDesignServicePaid ?? work?.IsDesignServicePaid
    ?? ['IN_PROGRESS', 'REVIEWING', 'COMPLETED'].includes(rawStatus);

  return {
    ...work,
    id: work?.id || work?.Id,
    title: work?.title || work?.Title || work?.name || work?.Name,
    name: work?.name || work?.Name,
    code: work?.code || work?.Code || work?.name || work?.Name,
    status: statusMap[rawStatus] || rawStatus,
    designWorkStatus: rawStatus,
    isLocked: work?.isLocked ?? work?.IsLocked ?? false,
    baseImageUrl: work?.baseImageUrl || work?.BaseImageUrl,
    resultDraftId: work?.resultDraftId || work?.ResultDraftId,
    workType: work?.workType || work?.WorkType || null,
    selections: work?.selections || work?.Selections || [],
    subRevisions: work?.subRevisions || work?.SubRevisions || [],
    designServiceOrderId: work?.designServiceOrderId || work?.DesignServiceOrderId,
    designServiceOrderCode: work?.designServiceOrderCode || work?.DesignServiceOrderCode,
    designServiceOrderStatus: work?.designServiceOrderStatus || work?.DesignServiceOrderStatus,
    designServicePaid,
    designServicePaymentStatus:
      work?.designServicePaymentStatus || work?.DesignServicePaymentStatus
      || (designServicePaid ? 'PAID' : 'UNPAID'),
    designServiceTotalAmount: work?.designServiceTotalAmount || work?.DesignServiceTotalAmount,
    messages,
  };
}

export const getDesignRequestDetail = async (id) => {
  try {
    const detailRes = await axiosInstance.get(`/api/design-work/${id}/detail`);
    const detail = detailRes.data?.data || detailRes.data;
    const messages = await getDesignWorkMessagesSafe(id);
    return {
      ...detailRes.data,
      data: normalizeDesignWork(detail, messages),
      statusCode: detailRes.data?.statusCode || 200,
    };
  } catch (error) {
    if (error?.response?.status && error.response.status !== 404 && error.response.status !== 405) {
      throw error;
    }
  }

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
    if (!found) return { data: null, statusCode: 404 };
    const messages = await getDesignWorkMessagesSafe(id);
    return { data: { ...found, messages }, statusCode: 200 };
  }

  const messages = await getDesignWorkMessagesSafe(id);
  return { data: { ...match, messages }, statusCode: 200 };
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

function firstMaterialLine(components = []) {
  for (const component of components) {
    const material = (component.materials || []).find((row) => row.materialId && Number(row.grams) > 0);
    if (material) return material;
  }
  return null;
}

function estimateWeightFromComponents(components = []) {
  return components.reduce((total, component) => {
    const quantity = Math.max(1, Number(component.quantity) || 1);
    const grams = (component.materials || []).reduce((sum, row) => sum + (Number(row.grams) || 0), 0);
    return total + grams * quantity;
  }, 0);
}

async function resolveLatestVersionId(designWorkId, preferredId) {
  if (preferredId) return preferredId;
  const response = await axiosInstance.get(`/api/design-version/design-work/${designWorkId}`);
  const versions = response.data?.data || response.data || [];
  const latest = Array.isArray(versions) ? versions[0] : null;
  const latestId = latest?.id || latest?.Id;
  if (!latestId) {
    throw new Error('Khong tim thay phien ban thiet ke de tao technical draft.');
  }
  return latestId;
}

// ─── Staff: Gửi báo giá ─────────────────────────────────────────────────
// BE: POST /api/technical-draft
// Body: CreateTechnicalDraftCommand
export const submitQuote = async (id, payload = {}) => {
  const materialLine = firstMaterialLine(payload.components || []);
  const body = {
    DesignVersionHistoryId: await resolveLatestVersionId(
      id,
      payload.designVersionHistoryId || payload.DesignVersionHistoryId,
    ),
    MaterialId: payload.materialId || payload.MaterialId || materialLine?.materialId,
    InfillDensity: Number(payload.infillDensity ?? payload.InfillDensity ?? 20),
    LayerHeight: Number(payload.layerHeight ?? payload.LayerHeight ?? 0.2),
    EstimatedWeightPerUnit: Number(
      payload.estimatedWeightPerUnit
        ?? payload.EstimatedWeightPerUnit
        ?? estimateWeightFromComponents(payload.components || []),
    ),
    EstimatedPrintTimePerUnit: payload.estimatedPrintTimePerUnit ?? payload.EstimatedPrintTimePerUnit ?? null,
    UnitPrice: payload.unitPrice ?? payload.UnitPrice ?? payload.quotedPrice ?? null,
    MarkupPercentage: Number(payload.markupPercentage ?? payload.MarkupPercentage ?? 0),
    TechnicalNote: payload.technicalNote || payload.TechnicalNote || payload.staffNote || '',
  };

  if (!body.MaterialId) {
    throw new Error('Vui long chon vat lieu de tao technical draft.');
  }
  if (!body.EstimatedWeightPerUnit || body.EstimatedWeightPerUnit <= 0) {
    throw new Error('Khoi luong technical draft phai lon hon 0.');
  }

  const response = await axiosInstance.post('/api/technical-draft', body);
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
  return {
    ...response.data,
    data: extractResponseList(response.data).map(normalizeDesignLog),
  };
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

// ─── Yêu cầu hiệu chỉnh (Customer/Staff) ───────────────────────────────
// BE: POST /api/design-log/request-adjustment
export const requestAdjustment = async (designWorkId, { content, imageUrls, parentLogId } = {}) => {
  const response = await axiosInstance.post('/api/design-log/request-adjustment', {
    DesignWorkId: designWorkId,
    ParentLogId: parentLogId || undefined,
    Content: content,
    ImageUrls: imageUrls || [],
  });
  return response.data;
};

// ─── Duyệt yêu cầu hiệu chỉnh (Staff) ─────────────────────────────────
// BE: POST /api/design-log/{id}/review-adjustment
export const reviewAdjustment = async (logId, { isApproved, decisionNote } = {}) => {
  const response = await axiosInstance.post(`/api/design-log/${logId}/review-adjustment`, {
    IsApproved: isApproved,
    DecisionNote: decisionNote || undefined,
  });
  return response.data;
};
