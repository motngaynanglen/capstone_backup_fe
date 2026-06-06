import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Spin, message, Modal, Button } from 'antd';
import { getDesignRequestDetail, cancelDesignRequest, postDesignRequestMessage, uploadFile, lockDesignWork, requestAdjustment, addFilesToQuickPrint, confirmTechnicalDraft, getTechnicalDraftsByDesignWork, reviewFileVersion } from '../api/mainflow2Api';
import AdjustmentRequestCard from '../components/Mainflow2/AdjustmentRequestCard';
import TechnicalDraftCard from '../components/Mainflow2/TechnicalDraftCard';
import VersionUpdateCard from '../components/Mainflow2/VersionUpdateCard';
import SystemLogDivider from '../components/Mainflow2/SystemLogDivider';
import { cancelOrderApi, checkoutDesignApi } from '../api/orderApi';

import { getActiveServiceOptionsApi } from '../api/serviceApi';
import { useAuth } from '../contexts/AuthContext';
import useMainflow2Realtime from '../hooks/useMainflow2Realtime';

import ChatMessageBubble, { ChatComposer } from '../components/Mainflow2/ChatMessageBubble';
import { getMessageAuthorId } from '../components/Mainflow2/messageMetadataUtils';
import Model3DPreview from '../components/Mainflow2/Model3DPreview';
import ServiceOptionPicker from '../components/Mainflow2/ServiceOptionPicker';

// Real BE DesignWork statuses
const BE_STATUS_LABEL = {
  SKETCHING: 'Phác thảo',
  PENDING: 'Chờ tiếp nhận',
  IN_PROGRESS: 'Đang thực hiện',
  REVIEWING: 'Đang kiểm duyệt',
  COMPLETED: 'Đã nghiệm thu',
};


const LINKED_ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang sản xuất / in 3D',
  READY_FOR_SHIP: 'Sẵn sàng giao',
  FINISHED: 'Chờ giao hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const SHIPMENT_STATUS_LABEL = {
  PREPARING: 'Đang đóng gói',
  READY_FOR_PICKUP: 'Chờ lấy hàng',
  IN_TRANSIT: 'Đang giao',
  DELIVERED: 'Đã giao',
};

const goToDesignCheckout = (navigate, order) => {
  const versions = order.versions || order.quoteFileVersions || [];
  navigate('/checkout', {
    state: {
      designWorkId: order.id,
      designWorkSourceType: order.sourceType || 'CUSTOM_QUOTE_MF2',
      designWorkName: order.title ? `Thiết kế: ${order.title}` : 'Thiết kế theo yêu cầu',
      designWorkPrice: order.latestQuotedPrice,
      returnTo: `/custom-orders/${order.id}`,
    },
  });
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const designServiceSelectionKey = (designWorkId) => `design-service-selections:${designWorkId}`;

const beStatusColor = (status) => {
  if (status === 'SKETCHING') return { background: '#f3f4f6', color: '#6b7280' };
  if (status === 'PENDING') return { background: '#fffbeb', color: '#d97706' };
  if (status === 'IN_PROGRESS') return { background: '#eff6ff', color: '#2563eb' };
  if (status === 'REVIEWING') return { background: '#f5f3ff', color: '#7c3aed' };
  if (status === 'COMPLETED') return { background: '#ecfdf5', color: '#059669' };
  return { background: '#fef2f2', color: '#dc2626' };
};

/**
 * Build customer timeline from real BE designWorkStatus + payment.
 */
const isWorkTypePrint = (order) =>
  ['PRINT_SERVICE', 'CUSTOM_FILE_PRINT_MF2'].includes(order?.workType || order?.WorkType || '');

function buildCustomerTimeline(order) {
  const raw = order?.designWorkStatus || '';
  const isPrint = isWorkTypePrint(order);
  // PRINT_SERVICE has no design fee — treat as always paid
  const paid = isPrint ? true : (order?.designServicePaid || order?.designServicePaymentStatus === 'PAID');
  const rankMap = { SKETCHING: 0, PENDING: 0, IN_PROGRESS: 1, REVIEWING: 2, COMPLETED: 3 };
  const rank = rankMap[raw] ?? -1;

  const step2 = isPrint
    ? { key: 'fileReview', label: rank >= 1 ? 'File đã duyệt' : 'Chờ duyệt file', done: rank >= 1, isCurrent: rank === 0 }
    : { key: 'paid', label: paid ? 'Đã thanh toán phí TK' : 'Chờ thanh toán', done: paid, isCurrent: !paid && rank === 0 };

  return [
    { key: 'request', label: 'Gửi yêu cầu', done: true, isCurrent: false },
    step2,
    { key: 'assigned', label: rank >= 1 ? 'NV đã nhận' : 'Chờ tiếp nhận', done: rank >= 1, isCurrent: paid && rank === 0 && !step2.isCurrent },
    { key: 'quoted', label: rank >= 2 ? 'Có báo giá' : 'Chờ báo giá', done: rank >= 2, isCurrent: rank === 1 },
    { key: 'completed', label: rank >= 3 ? 'Đã nghiệm thu' : 'Chờ duyệt', done: rank >= 3, isCurrent: rank === 2 },
  ];
}

const CustomOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [technicalDrafts, setTechnicalDrafts] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [pendingServiceSelections, setPendingServiceSelections] = useState([]);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);

  const [chatMessage, setChatMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesContainerRef = useRef(null);

  // Adjustment request
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustContent, setAdjustContent] = useState('');
  const [adjustFiles, setAdjustFiles] = useState([]);

  // Re-upload (PRINT_SERVICE — file rejected)
  const [reuploadFiles, setReuploadFiles] = useState([]);
  const [reuploadNote, setReuploadNote] = useState('');

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [order?.messages]);

  const fetchDetail = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getDesignRequestDetail(id);
      if (res?.statusCode === 200) setOrder(res.data);
      else message.error(res?.message || 'Không tìm thấy chi tiết yêu cầu');
    } catch {
      message.error('Lỗi khi lấy chi tiết yêu cầu');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(designServiceSelectionKey(id));
      setPendingServiceSelections(raw ? JSON.parse(raw) : []);
    } catch {
      setPendingServiceSelections([]);
    }
  }, [id]);

  const fetchTechnicalDrafts = useCallback(async () => {
    try {
      // Thử wrapper mới trước, fallback sang API cũ
      const drafts = await getTechnicalDraftsByDesignWork(id);
      setTechnicalDrafts(Array.isArray(drafts) ? drafts : []);
    } catch {
      try {
        const res = await technicalDraftApi.getByDesignWork(id);
        setTechnicalDrafts(res?.data || []);
      } catch {
        setTechnicalDrafts([]);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchTechnicalDrafts();
    getActiveServiceOptionsApi()
      .then((res) => setServiceOptions(res?.data || []))
      .catch(() => setServiceOptions([]));
  }, [fetchTechnicalDrafts]);

  useMainflow2Realtime(id, () => { fetchDetail(true); fetchTechnicalDrafts(); });

  const handleRequestAdjustment = async () => {
    if (!adjustContent.trim() && adjustFiles.length === 0) {
      message.warning('Vui lòng nhập nội dung hoặc đính kèm hình ảnh');
      return;
    }
    try {
      setProcessing(true);
      // Upload images if any
      let imageUrls = [];
      for (const file of adjustFiles) {
        const up = await uploadFile(file);
        const url = up?.data?.publicUrl || up?.data?.url || up?.publicUrl || up?.url;
        if (url) imageUrls.push(url);
      }
      await requestAdjustment(id, { content: adjustContent.trim(), imageUrls });
      message.success('Đã gửi yêu cầu hiệu chỉnh');
      setAdjustModalOpen(false);
      setAdjustContent('');
      setAdjustFiles([]);
      fetchDetail(true);
    } catch (err) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleReuploadFiles = async () => {
    if (reuploadFiles.length === 0) {
      message.warning('Vui lòng chọn file để tải lên');
      return;
    }
    try {
      setProcessing(true);
      let fileUrls = [];
      for (const file of reuploadFiles) {
        const up = await uploadFile(file);
        const url = up?.data?.publicUrl || up?.data?.url || up?.publicUrl || up?.url;
        if (url) fileUrls.push(url);
      }
      await addFilesToQuickPrint(id, fileUrls, reuploadNote.trim() || undefined);
      message.success('Đã tải lên lại file thành công');
      setReuploadFiles([]);
      setReuploadNote('');
      fetchDetail(true);
    } catch (err) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Lỗi khi tải file lên');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendChat = async ({ content, file }) => {
    const text = content?.trim();
    if (!text && !file) return;
    try {
      setUploading(true);
      let attachmentUrls = [];
      if (file) {
        const up = await uploadFile(file);
        const url = up?.data?.publicUrl || up?.data?.url || up?.publicUrl || up?.url;
        if (!url) {
          message.error('Upload file thất bại');
          return;
        }
        attachmentUrls = [url];
      }
      const res = await postDesignRequestMessage(id, {
        content: text || `[File: ${file?.name || 'đính kèm'}]`,
        attachmentUrls,
      });
      if (res?.statusCode === 200) {
        setChatMessage('');
        fetchDetail(true);
      } else message.error(res?.message || 'Lỗi gửi tin');
    } catch {
      message.error('Lỗi khi gửi tin nhắn');
    } finally {
      setUploading(false);
    }
  };

  const handleApproveDraft = (draftId) => {
    Modal.confirm({
      title: 'Duyệt báo giá kỹ thuật',
      content: 'Xác nhận duyệt báo giá này? Thiết kế sẽ được nghiệm thu. Cuộc trò chuyện vẫn mở.',
      okText: 'Duyệt báo giá',
      okButtonProps: { style: { background: '#059669', borderColor: '#059669' } },
      onOk: async () => {
        try {
          setProcessing(true);
          const res = await confirmTechnicalDraft(draftId);
          if (res?.statusCode === 200 || res?.code === 'UPDATED') {
            message.success('Đã duyệt báo giá thành công!');
            fetchDetail();
            fetchTechnicalDrafts();
          } else {
            message.error(res?.message || 'Lỗi khi duyệt');
          }
        } catch (err) {
          message.error(err?.response?.data?.message || 'Lỗi khi duyệt báo giá');
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const handleRejectDraft = async (draftId, reason) => {
    try {
      setProcessing(true);
      await requestAdjustment(id, {
        content: `[Không duyệt báo giá] ${reason}`,
        imageUrls: [],
      });
      message.success('Đã gửi yêu cầu hiệu chỉnh cho nhân viên');
      fetchDetail(true);
      fetchTechnicalDrafts();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewFile = async (versionId, status, note) => {
    try {
      setProcessing(true);
      await reviewFileVersion(versionId, { ReviewStatus: status, ReviewNote: note || null });
      message.success(status === 'ACCEPTED' ? 'Đã duyệt file thành công!' : 'Đã từ chối file');
      fetchDetail(true);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi khi duyệt file');
    } finally {
      setProcessing(false);
    }
  };

  const handleLockChat = () => {
    Modal.confirm({
      title: 'Khóa cuộc trò chuyện',
      icon: null,
      content: (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
            Sau khi khóa, bạn và nhân viên sẽ <b>không thể gửi tin nhắn</b> trong cuộc trò chuyện này nữa.
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '8px 0 0' }}>
            Hành động này không thể hoàn tác.
          </p>
        </div>
      ),
      okText: 'Khóa cuộc trò chuyện',
      okButtonProps: { danger: true, style: { fontWeight: 700 } },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setProcessing(true);
          await lockDesignWork(id);
          message.success('Đã khóa cuộc trò chuyện');
          fetchDetail();
        } catch (err) {
          message.error(err?.response?.data?.message || 'Lỗi khi khóa');
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const paidServiceRows = useMemo(() => {
    const selections = order?.selections || [];
    return selections.flatMap((selection) => {
      const items = selection.serviceSelectedOptions || selection.ServiceSelectedOptions || [];
      return items.map((item) => ({
        id: item.serviceOptionId || item.ServiceOptionId || item.id || item.Id,
        name: item.optionNameSnapshot || item.OptionNameSnapshot || 'Tùy chọn dịch vụ',
        groupName: item.optionGroupNameSnapshot || item.OptionGroupNameSnapshot || item.optionGroupCodeSnapshot || item.OptionGroupCodeSnapshot,
        quantity: item.quantity || item.Quantity || 1,
        price: item.appliedPrice || item.AppliedPrice || 0,
      }));
    });
  }, [order?.selections]);

  const pendingServiceRows = useMemo(() => {
    return pendingServiceSelections.map((selection) => {
      const optionId = selection.serviceOptionId || selection.ServiceOptionId;
      const option = serviceOptions.find((item) => item.id === optionId || item.Id === optionId);
      return {
        id: optionId,
        name: option?.name || option?.Name || optionId,
        groupName: option?.groupName || option?.GroupName || option?.groupCode || option?.GroupCode,
        quantity: selection.quantity || selection.Quantity || 1,
        price: option?.defaultPrice || option?.DefaultPrice || 0,
      };
    });
  }, [pendingServiceSelections, serviceOptions]);

  const serviceRows = paidServiceRows.length > 0 ? paidServiceRows : pendingServiceRows;
  const serviceTotal = serviceRows.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const designFeeOrderId = order?.designServiceOrderId;
  const designFeePaid = order?.designServicePaymentStatus === 'PAID';
  const handlePendingServiceChange = (items) => {
    setPendingServiceSelections(items);
    if (items.length > 0) {
      sessionStorage.setItem(designServiceSelectionKey(id), JSON.stringify(items));
    } else {
      sessionStorage.removeItem(designServiceSelectionKey(id));
    }
  };

  const handlePayDesignService = async () => {
    if (designFeeOrderId) {
      navigate(`/orders/${designFeeOrderId}`);
      return;
    }

    const serviceOptionsPayload = pendingServiceSelections
      .map((item) => ({
        ServiceOptionId: item.serviceOptionId || item.ServiceOptionId,
        Quantity: item.quantity || item.Quantity || 1,
      }))
      .filter((item) => item.ServiceOptionId);

    if (serviceOptionsPayload.length === 0) {
      message.warning('Không tìm thấy nội dung dịch vụ đã chọn. Vui lòng tạo lại yêu cầu hoặc liên hệ nhân viên.');
      return;
    }

    try {
      setProcessing(true);
      const res = await checkoutDesignApi({
        DesignWorkId: id,
        ServiceOptions: serviceOptionsPayload,
        Note: 'Thanh toán phí dịch vụ thiết kế',
      });
      const newOrderId = res?.data?.id || res?.data?.Id || res?.id || res?.Id;
      sessionStorage.removeItem(designServiceSelectionKey(id));
      await fetchDetail(true);
      if (newOrderId) navigate(`/orders/${newOrderId}`);
      else message.success('Đã tạo đơn phí dịch vụ thiết kế.');
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Tạo đơn phí thiết kế thất bại.');
    } finally {
      setProcessing(false);
    }
  };


  const handleCancel = () => {
    const designWorkId = order?.id || id;
    const linkedId = order?.orderId;
    const awaitingPayment = Boolean(linkedId) && order?.linkedPaymentStatus !== 'PAID';
    const cancelLinkedOrder = awaitingPayment && linkedId;

    Modal.confirm({
      title: cancelLinkedOrder ? 'Hủy đơn hàng' : 'Hủy yêu cầu',
      content: cancelLinkedOrder
        ? 'Đơn hàng chưa thanh toán sẽ bị hủy. Bạn vẫn có thể đặt lại sau khi duyệt báo giá.'
        : 'Bạn có chắc chắn muốn hủy yêu cầu thiết kế này không?',
      okText: cancelLinkedOrder ? 'Hủy đơn hàng' : 'Hủy yêu cầu',
      okType: 'danger',
      cancelText: 'Bỏ qua',
      onOk: async () => {
        try {
          setProcessing(true);
          if (cancelLinkedOrder) {
            const res = await cancelOrderApi(linkedId, 'Khách hủy đơn custom');
            if (res?.statusCode === 200) {
              message.success('Đã hủy đơn hàng!');
              fetchDetail();
            } else {
              message.error(res?.message || 'Lỗi khi hủy đơn');
            }
            return;
          }

          if (!designWorkId) {
            message.error('Thiếu mã yêu cầu — không thể hủy.');
            return;
          }

          const res = await cancelDesignRequest(designWorkId);
          if (res?.statusCode === 200) {
            message.success('Đã hủy yêu cầu!');
            fetchDetail();
          } else {
            message.error(res?.message || 'Lỗi khi hủy');
          }
        } catch (err) {
          message.error(err?.response?.data?.message || err?.message || 'Lỗi khi hủy');
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <Spin size="large" />
      </div>
    );
  }

  const linkedOrderId = order?.orderId;
  const isPaid = order?.linkedPaymentStatus === 'PAID';
  const hasLinkedOrder = Boolean(linkedOrderId);
  const showPayButtons = order?.designWorkStatus === 'COMPLETED' && !hasLinkedOrder && order?.latestQuotedPrice != null;
  const showAwaitingPayment = hasLinkedOrder && !isPaid;
  const showProduction = hasLinkedOrder && isPaid;
  const fileVersions = order?.versions || order?.quoteFileVersions || [];
  const isPrintService = isWorkTypePrint(order);
  const adjustmentSels = order?.selections || [];
  const adjustmentTotalLimit = adjustmentSels.reduce((s, x) => s + (x.adjustmentRoundLimit || 0), 0);
  const adjustmentRemaining = adjustmentSels.reduce((s, x) => s + (x.remainingAdjustmentRoundCount || 0), 0);
  const canAdjust = adjustmentRemaining > 0;

  const headerStatusLabel = showProduction
      ? (order.linkedOrderStatus === 'FINISHED' || order.linkedShipmentStatus === 'READY_FOR_PICKUP'
      ? (LINKED_ORDER_STATUS_LABEL.READY_FOR_SHIP ?? 'Sẵn sàng giao')
      : order.linkedShipmentStatus === 'IN_TRANSIT'
        ? 'Đang giao hàng'
        : order.linkedOrderStatus === 'PROCESSING' || order.linkedShipmentStatus === 'PREPARING'
          ? 'Đang sản xuất / in 3D'
          : SHIPMENT_STATUS_LABEL[order.linkedShipmentStatus]
            || LINKED_ORDER_STATUS_LABEL[order.linkedOrderStatus]
            || 'Đang xử lý đơn')
    : order.isLocked && order.designWorkStatus !== 'COMPLETED'
      ? 'Đã đóng'
      : (BE_STATUS_LABEL[order?.designWorkStatus] || order?.designWorkStatus || order?.status);

  const headerStatusStyle = showProduction
    ? { background: '#eff6ff', color: '#2563eb' }
    : beStatusColor(order?.designWorkStatus);

  if (!order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <h2 style={{ fontWeight: 700, color: '#111827' }}>Không tìm thấy yêu cầu</h2>
        <Link to="/my-custom-orders" style={{ color: '#4f46e5' }}>Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>

      {/* TOPBAR */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/my-custom-orders"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', color: '#374151', textDecoration: 'none', fontSize: 16 }}>
          ←
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>#{order.code || order.name || '—'}</p>
        </div>
        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...headerStatusStyle }}>
          {headerStatusLabel}
        </span>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: isPrintService ? '#dbeafe' : '#fae8ff',
          color: isPrintService ? '#1d4ed8' : '#a21caf',
        }}>
          {isPrintService ? 'In theo yêu cầu' : 'Thiết kế 3D'}
        </span>
        {showProduction && linkedOrderId && (
          <Link
            to={`/orders/${linkedOrderId}`}
            style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
          >
            Xem đơn {order.linkedOrderCode ? `#${order.linkedOrderCode}` : ''}
          </Link>
        )}
        {/* Chỉ cho hủy khi: chưa locked, chưa vào sản xuất, và đơn dịch vụ chưa được thanh toán */}
        {!order.isLocked && !showProduction && !isPaid && !designFeePaid && ['SKETCHING', 'PENDING'].includes(order.designWorkStatus) && (
          <button onClick={handleCancel} disabled={processing}
            style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {showAwaitingPayment ? 'Hủy đơn hàng' : 'Hủy yêu cầu'}
          </button>
        )}
        {/* Nút khóa chat — hiện khi đã duyệt (COMPLETED) và chưa locked */}
        {order.designWorkStatus === 'COMPLETED' && !order.isLocked && (
          <Button
            danger
            loading={processing}
            onClick={handleLockChat}
            style={{ fontWeight: 700, borderRadius: 8 }}
          >
            🔒 KHÓA CUỘC TRÒ CHUYỆN
          </Button>
        )}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* CHAT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages list */}
          <div ref={messagesContainerRef}
            style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

{/* Messages + inline drafts + adjustment requests */}
            {order.messages?.length > 0 ? order.messages.map((msg, i) => {
              const isMe = getMessageAuthorId(msg) === user?.id;
              const logType = (msg.logType || '').toUpperCase();
              const isAdjustment = logType === 'ADJUSTMENT_REQUEST';
              const isVersionUpdate = logType === 'VERSION_UPDATE';

              // Log hệ thống/tự động → đường gạch ngang kèm thông báo, không phải bong bóng chat.
              if (logType === 'SYSTEM' || logType === 'STATUS_CHANGE') {
                return <SystemLogDivider key={msg.id || i} content={msg.content} created={msg.created} />;
              }

              if (isAdjustment) {
                return (
                  <AdjustmentRequestCard
                    key={msg.id || i}
                    msg={msg}
                    isStaff={false}
                    processing={processing}
                  />
                );
              }

              // VERSION_UPDATE log — card đầy đủ: nội dung + 3D + nút Xem + duyệt báo giá kèm theo.
              // Tin từ nhân viên → căn trái (isMe=false). Khách duyệt thiết kế = duyệt báo giá kỹ thuật.
              if (isVersionUpdate) {
                return (
                  <VersionUpdateCard
                    key={msg.id || i}
                    msg={msg}
                    isMe={isMe}
                    role="customer"
                    drafts={technicalDrafts}
                    isPrintService={isWorkTypePrint(order)}
                    designWorkStatus={order.designWorkStatus}
                    isLocked={order.isLocked}
                    processing={processing}
                    onApproveDraft={handleApproveDraft}
                    onRejectDraft={handleRejectDraft}
                    onReviewFile={handleReviewFile}
                  />
                );
              }

              // Fallback: also check for QUOTE logType (legacy)
              if (logType.includes('QUOTE')) {
                // Find latest unconfirmed draft to show approve
                const latestDraft = technicalDrafts.length > 0
                  ? technicalDrafts[technicalDrafts.length - 1]
                  : null;
                if (latestDraft) {
                  const canApprove = !latestDraft.isConfirmed && !order.isLocked
                    && ['REVIEWING', 'IN_PROGRESS'].includes(order.designWorkStatus);
                  return (
                    <TechnicalDraftCard
                      key={msg.id || i}
                      draft={latestDraft}
                      showApprove={canApprove}
                      onApprove={handleApproveDraft}
                      onReject={handleRejectDraft}
                      loading={processing}
                      senderName={msg.senderName || 'Nhân viên'}
                      createdAt={msg.created}
                    />
                  );
                }
              }

              return (
                <ChatMessageBubble
                  key={msg.id || i}
                  msg={msg}
                  isMe={isMe}
                  otherLabel="Nhân viên"
                />
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>
                Chưa có tin nhắn. Nhân viên sẽ liên hệ sớm!
              </div>
            )}
          </div>

          {/* Composer */}
          {order.isLocked ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: 600 }}>
              Cuộc trò chuyện đã được khóa.
            </div>
          ) : order.isLocked && order.designWorkStatus !== 'COMPLETED' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
              Yêu cầu đã đóng.
            </div>
          ) : showProduction ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', color: '#2563eb', fontSize: 14, fontWeight: 700 }}>
                Đơn đã thanh toán — đang theo dõi tiến độ sản xuất & giao hàng
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                {order.linkedTrackingNumber
                  ? `Mã vận đơn: ${order.linkedTrackingNumber}`
                  : 'Shop sẽ cập nhật trạng thái khi bắt đầu in và giao hàng.'}
              </p>
            </div>
          ) : showAwaitingPayment ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#d97706', fontSize: 14, fontWeight: 600 }}>
                Đơn hàng đã tạo — vui lòng hoàn tất thanh toán để bắt đầu sản xuất
              </div>
              <Button
                type="primary"
                size="large"
                style={{ background: '#4f46e5', borderColor: '#4f46e5', height: 44, borderRadius: 12, fontWeight: 700 }}
                onClick={() => navigate(`/orders/${linkedOrderId}`)}
              >
                Thanh toán đơn {order.linkedOrderCode ? `#${order.linkedOrderCode}` : ''}
              </Button>
            </div>
          ) : showPayButtons ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#059669', fontSize: 14, fontWeight: 600 }}>
                🎉 Chúc mừng! Thiết kế đã được duyệt với giá {formatPrice(order.latestQuotedPrice)}
              </div>
              <Button
                type="primary"
                size="large"
                style={{ background: '#4f46e5', borderColor: '#4f46e5', height: 48, borderRadius: 12, padding: '0 32px', fontWeight: 700, fontSize: 16 }}
                onClick={() => goToDesignCheckout(navigate, order)}
              >
                🚀 Thanh toán & Đặt hàng ngay
              </Button>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Bấm để thanh toán — shop sẽ bắt đầu sản xuất và gửi hàng cho bạn.</p>
            </div>
          ) : (
            <>
              {/* Re-upload panel khi file bi tu choi (PRINT_SERVICE + SKETCHING) */}
              {isPrintService && order.designWorkStatus === 'SKETCHING' && (
                <div style={{ flexShrink: 0, background: '#fef2f2', borderTop: '1px solid #fca5a5', padding: '12px 16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                    File của bạn bị từ chối. Vui lòng tải lên lại file mới:
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      accept=".glb,.gltf,.stl,.obj,.step,.stp,.igs,.iges,.3mf"
                      multiple
                      onChange={(e) => setReuploadFiles(Array.from(e.target.files || []))}
                      style={{ fontSize: 12 }}
                    />
                    {reuploadFiles.length > 0 && (
                      <Button
                        type="primary"
                        size="small"
                        loading={processing}
                        style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                        onClick={handleReuploadFiles}
                      >
                        Tải lên lại ({reuploadFiles.length} file)
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <ChatComposer
                value={chatMessage}
                onChange={setChatMessage}
                onSend={handleSendChat}
                uploading={uploading}
                extraLeft={
                  (isPrintService || designFeePaid) && !order.isLocked && ['IN_PROGRESS', 'REVIEWING', 'COMPLETED'].includes(order.designWorkStatus) ? (
                    <Button
                      onClick={() => setAdjustModalOpen(true)}
                      disabled={!canAdjust}
                      title={!canAdjust ? 'Đã hết lượt hiệu chỉnh' : ''}
                      style={{ flexShrink: 0, background: canAdjust ? '#fffbeb' : '#f3f4f6', borderColor: canAdjust ? '#fde68a' : '#d1d5db', color: canAdjust ? '#d97706' : '#9ca3af', fontWeight: 600 }}
                    >
                      Yêu cầu hiệu chỉnh
                    </Button>
                  ) : null
                }
              />
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 260, flexShrink: 0, overflowY: 'auto', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>

          {/* Timeline */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              {showProduction ? 'Tiến độ làm việc' : 'Tiến trình'}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {buildCustomerTimeline(order).map((step, idx, arr) => (
                <li key={step.key} style={{ display: 'flex', gap: 12, paddingBottom: idx < arr.length - 1 ? 16 : 0, position: 'relative' }}>
                  {idx < arr.length - 1 && (
                    <div style={{ position: 'absolute', left: 11, top: 24, width: 2, bottom: 0, background: step.done ? '#4f46e5' : '#e5e7eb' }} />
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    background: step.isCurrent ? '#4f46e5' : step.done ? '#4f46e5' : '#f3f4f6',
                    color: step.done || step.isCurrent ? '#fff' : '#9ca3af',
                    border: step.isCurrent ? '2px solid #a5b4fc' : 'none',
                    zIndex: 1,
                  }}>
                    {step.done && !step.isCurrent ? '✓' : idx + 1}
                  </div>
                  <p style={{ margin: 'auto 0', fontSize: 13, fontWeight: step.isCurrent ? 700 : 500, color: step.isCurrent ? '#4f46e5' : step.done ? '#111827' : '#9ca3af' }}>
                    {step.label}
                  </p>
                </li>
              ))}
              {order.isLocked && order.designWorkStatus !== 'COMPLETED' && (
                <li style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#dc2626' }}>✕</div>
                  <p style={{ margin: 'auto 0', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Đã đóng</p>
                </li>
              )}
            </ul>
          </div>

          {/* Lượt hiệu chỉnh còn lại */}
          {adjustmentTotalLimit > 0 && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Lượt hiệu chỉnh
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: canAdjust ? '#ecfdf5' : '#fef2f2',
                  color: canAdjust ? '#059669' : '#dc2626',
                }}>
                  {adjustmentRemaining}/{adjustmentTotalLimit} còn lại
                </span>
              </div>
            </div>
          )}

          {/* Design service fee — only for DESIGN_SERVICE */}
          {!isPrintService && (
          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              Phí dịch vụ thiết kế
            </p>
            {serviceRows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {serviceRows.map((item) => (
                  <div key={item.id} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {item.groupName || 'Dịch vụ'} x {item.quantity}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                      {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span>Tổng</span>
                  <span>{formatPrice(order.designServiceTotalAmount || serviceTotal)}</span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af' }}>Chưa có nội dung dịch vụ đã chọn.</p>
                {!designFeeOrderId && (
                  <Button block onClick={() => setServicePickerOpen(true)}>
                    Chọn dịch vụ thiết kế
                  </Button>
                )}
              </div>
            )}

            {!designFeePaid ? (
              <Button
                type="primary"
                block
                loading={processing}
                style={{ marginTop: 12, background: '#4f46e5', borderColor: '#4f46e5', fontWeight: 700 }}
                onClick={handlePayDesignService}
                disabled={!designFeeOrderId && pendingServiceSelections.length === 0}
              >
                {designFeeOrderId ? 'Thanh toán phí dịch vụ thiết kế' : 'Tạo đơn thanh toán phí thiết kế'}
              </Button>
            ) : (
              <div style={{ marginTop: 12, color: '#059669', fontSize: 12, fontWeight: 700 }}>
                Đã thanh toán phí dịch vụ thiết kế
              </div>
            )}
          </div>
          )}

          {/* Technical drafts */}
          {technicalDrafts.length > 0 && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Báo giá kỹ thuật
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {technicalDrafts.map((draft) => {
                  const draftId = draft.id || draft.Id;
                  const isConfirmedDraft = draft.isConfirmed || draft.IsConfirmed;
                  const unitPrice = draft.unitPrice ?? draft.UnitPrice ?? draft.finalPrice ?? draft.FinalPrice ?? draft.price ?? draft.Price;
                  return (
                    <div key={draftId} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                        {draft.name || draft.designWorkName || draft.DesignWorkName || 'Báo giá'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                        {draft.materialName || draft.MaterialName || 'Vật liệu'} — {draft.estimatedWeightPerUnit || draft.EstimatedWeightPerUnit || 0}g
                      </div>
                      <div style={{ fontSize: 16, color: '#065f46', fontWeight: 800, marginTop: 6 }}>
                        {formatPrice(unitPrice)}
                      </div>
                      {isConfirmedDraft ? (
                        <div style={{ marginTop: 8, color: '#059669', fontSize: 12, fontWeight: 800 }}>
                          ✓ Đã duyệt báo giá
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <Button
                            block
                            danger
                            loading={processing}
                            disabled={!canAdjust}
                            title={!canAdjust ? 'Đã hết lượt hiệu chỉnh' : ''}
                            onClick={() => {
                              Modal.confirm({
                                title: 'Không duyệt báo giá',
                                content: 'Bạn muốn yêu cầu nhân viên hiệu chỉnh lại báo giá?',
                                okText: 'Yêu cầu hiệu chỉnh',
                                okType: 'danger',
                                cancelText: 'Hủy',
                                onOk: () => handleRejectDraft(draft.id || draft.Id, 'Yêu cầu hiệu chỉnh báo giá'),
                              });
                            }}
                          >
                            Không duyệt
                          </Button>
                          <Button
                            block
                            type="primary"
                            loading={processing}
                            style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
                            onClick={() => handleApproveDraft(draft.id || draft.Id)}
                          >
                            Duyệt
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quote summary + approve button */}
          {order.latestQuotedPrice != null && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Báo giá cuối</p>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: '#065f46' }}>{formatPrice(order.latestQuotedPrice)}</p>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: '#9ca3af' }}>Phiên bản {order.quoteRevision}</p>
              
              {showPayButtons && (
                <Button
                  type="primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5', width: '100%', fontWeight: 700 }}
                  onClick={() => goToDesignCheckout(navigate, order)}
                >
                  🚀 Thanh toán ngay
                </Button>
              )}
              {showAwaitingPayment && (
                <Button
                  type="primary"
                  style={{ background: '#d97706', borderColor: '#d97706', width: '100%', fontWeight: 700 }}
                  onClick={() => navigate(`/orders/${linkedOrderId}`)}
                >
                  Hoàn tất thanh toán
                </Button>
              )}
              {showProduction && (
                <Link
                  to={`/orders/${linkedOrderId}`}
                  style={{
                    display: 'block', textAlign: 'center', marginTop: 8, padding: '8px 12px',
                    background: '#eff6ff', borderRadius: 8, color: '#2563eb', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Chi tiết đơn hàng →
                </Link>
              )}
            </div>
          )}

          {/* 3D preview */}
          {(order.latestQuotePreviewUrl || order.customerFileUrl) && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Xem trước 3D
              </p>
              <Model3DPreview fileUrl={order.latestQuotePreviewUrl || order.customerFileUrl} height={180} />
            </div>
          )}

          {/* File versions */}
          {fileVersions.length > 0 && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>File 3D đính kèm</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fileVersions.map((f, i) => (
                  <div key={i}>
                    <Model3DPreview fileUrl={f.fileUrl || f.url} height={140} />
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
                      {f.title || `File v${f.versionNumber}`} · Phiên bản {f.versionNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order info */}
          <div style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Mã yêu cầu</p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all' }}>{order.code || order.name || '—'}</p>
          </div>
        </div>
      </div>
      {!isPrintService && (
      <Modal
        open={servicePickerOpen}
        title="Chọn dịch vụ thiết kế"
        onCancel={() => setServicePickerOpen(false)}
        onOk={() => setServicePickerOpen(false)}
        okText="Lưu lựa chọn"
        cancelText="Đóng"
        width={760}
      >
        <ServiceOptionPicker value={pendingServiceSelections} onChange={handlePendingServiceChange} />
      </Modal>
      )}

      {/* Adjustment request modal */}
      <Modal
        title="Yêu cầu hiệu chỉnh thiết kế"
        open={adjustModalOpen}
        onOk={handleRequestAdjustment}
        onCancel={() => { setAdjustModalOpen(false); setAdjustContent(''); setAdjustFiles([]); }}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        okButtonProps={{ disabled: !adjustContent.trim() && adjustFiles.length === 0, loading: processing }}
      >
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151' }}>
          Mô tả nội dung cần hiệu chỉnh. Lưu ý: mỗi lần hiệu chỉnh sẽ tiêu một lượt trong gói dịch vụ.
        </p>
        <textarea
          value={adjustContent}
          onChange={(e) => setAdjustContent(e.target.value)}
          placeholder="VD: Điều chỉnh kích thước phần đế mô hình, thêm logo ở mặt trước..."
          rows={4}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', marginBottom: 12 }}
        />
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Hình ảnh minh họa (tùy chọn):</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setAdjustFiles(Array.from(e.target.files || []))}
            style={{ fontSize: 12 }}
          />
          {adjustFiles.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
              Đã chọn {adjustFiles.length} hình ảnh
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CustomOrderDetail;
