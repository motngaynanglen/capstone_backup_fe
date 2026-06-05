import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Spin, message, Modal, Button } from 'antd';
import { getDesignRequestDetail, approveQuote, cancelDesignRequest, postDesignRequestMessage, uploadFile, lockDesignWork } from '../api/mainflow2Api';
import { cancelOrderApi, checkoutDesignApi } from '../api/orderApi';
import technicalDraftApi from '../api/technicalDraftApi';
import { getActiveServiceOptionsApi } from '../api/serviceApi';
import { useAuth } from '../contexts/AuthContext';
import useMainflow2Realtime from '../hooks/useMainflow2Realtime';
import QuoteMessageCard from '../components/Mainflow2/QuoteMessageCard';
import ChatMessageBubble, { ChatComposer } from '../components/Mainflow2/ChatMessageBubble';
import { getMessageAuthorId } from '../components/Mainflow2/messageMetadataUtils';
import Model3DPreview from '../components/Mainflow2/Model3DPreview';
import ServiceOptionPicker from '../components/Mainflow2/ServiceOptionPicker';

const CUSTOM_STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Gửi yêu cầu' },
  { key: 'ASSIGNED', label: 'NV đã nhận' },
  { key: 'QUOTED', label: 'Có báo giá' },
  { key: 'NEGOTIATING', label: 'Thương lượng' },
  { key: 'APPROVED', label: 'Đã duyệt' },
];

const STATUS_ORDER = CUSTOM_STATUS_STEPS.map(s => s.key);

const STATUS_LABEL = {
  SUBMITTED: 'Mới gửi',
  ASSIGNED: 'NV đã nhận',
  QUOTED: 'Có báo giá',
  NEGOTIATING: 'Đang thương lượng',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
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

const statusColor = (status) => {
  if (status === 'SUBMITTED') return { background: '#f3f4f6', color: '#6b7280' };
  if (status === 'ASSIGNED') return { background: '#eff6ff', color: '#2563eb' };
  if (status === 'QUOTED') return { background: '#f5f3ff', color: '#7c3aed' };
  if (status === 'NEGOTIATING') return { background: '#fffbeb', color: '#d97706' };
  if (status === 'APPROVED') return { background: '#ecfdf5', color: '#059669' };
  return { background: '#fef2f2', color: '#dc2626' };
};

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
      const res = await technicalDraftApi.getByDesignWork(id);
      setTechnicalDrafts(res?.data || []);
    } catch {
      setTechnicalDrafts([]);
    }
  }, [id]);

  useEffect(() => {
    fetchTechnicalDrafts();
    getActiveServiceOptionsApi()
      .then((res) => setServiceOptions(res?.data || []))
      .catch(() => setServiceOptions([]));
  }, [fetchTechnicalDrafts]);

  useMainflow2Realtime(id, () => fetchDetail(true));

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

  const handleApprove = () => {
    Modal.confirm({
      title: 'Chấp nhận báo giá',
      content: 'Bạn có chắc chắn muốn chấp nhận báo giá này không?',
      okText: 'Chấp nhận',
      onOk: async () => {
        try {
          setProcessing(true);
          const res = await approveQuote(id);
          if (res?.statusCode === 200) { message.success('Đã chấp nhận báo giá!'); fetchDetail(); }
          else message.error(res?.message || 'Lỗi khi duyệt');
        } catch { message.error('Lỗi khi duyệt báo giá'); }
        finally { setProcessing(false); }
      }
    });
  };

  const paidServiceRows = useMemo(() => {
    const selections = order?.selections || [];
    return selections.flatMap((selection) => {
      const items = selection.serviceSelectedOptions || selection.ServiceSelectedOptions || [];
      return items.map((item) => ({
        id: item.serviceOptionId || item.ServiceOptionId || item.id || item.Id,
        name: item.optionNameSnapshot || item.OptionNameSnapshot || 'Tuy chon dich vu',
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
  const confirmedDraft = technicalDrafts.find((draft) => draft.isConfirmed || draft.IsConfirmed);
  const hasConfirmedDraft = Boolean(confirmedDraft);

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
      message.warning('Khong tim thay noi dung dich vu da chon. Vui long tao lai yeu cau hoac lien he nhan vien.');
      return;
    }

    try {
      setProcessing(true);
      const res = await checkoutDesignApi({
        DesignWorkId: id,
        ServiceOptions: serviceOptionsPayload,
        Note: 'Thanh toan phi dich vu thiet ke',
      });
      const newOrderId = res?.data?.id || res?.data?.Id || res?.id || res?.Id;
      sessionStorage.removeItem(designServiceSelectionKey(id));
      await fetchDetail(true);
      if (newOrderId) navigate(`/orders/${newOrderId}`);
      else message.success('Da tao don phi dich vu thiet ke.');
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Tao don phi thiet ke that bai.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmTechnicalDraft = (draft) => {
    Modal.confirm({
      title: 'Duyet bao gia ky thuat',
      content: 'Sau khi duyet, ban co the thay thiet ke nay trong Kho do thiet ke va van tiep tuc chat neu can.',
      okText: 'Duyet bao gia',
      cancelText: 'Bo qua',
      onOk: async () => {
        try {
          setProcessing(true);
          await technicalDraftApi.confirm(draft.id || draft.Id);
          message.success('Bao gia thanh cong.');
          await fetchTechnicalDrafts();
          await fetchDetail(true);
        } catch (err) {
          message.error(err?.response?.data?.message || err?.message || 'Duyet bao gia that bai.');
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleLockConversation = () => {
    Modal.confirm({
      title: 'KHOA CUOC TRO CHUYEN',
      content: 'Thao tac nay khoa DesignWork va ket thuc luong thiet ke 3D rieng. Ban chi nen khoa sau khi da chot xong voi shop.',
      okText: 'Khoa cuoc tro chuyen',
      okType: 'danger',
      cancelText: 'Bo qua',
      onOk: async () => {
        try {
          setProcessing(true);
          await lockDesignWork(id);
          message.success('Da khoa cuoc tro chuyen.');
          await fetchDetail(true);
        } catch (err) {
          message.error(err?.response?.data?.message || err?.message || 'Khoa cuoc tro chuyen that bai.');
        } finally {
          setProcessing(false);
        }
      },
    });
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
  const showPayButtons = order?.status === 'APPROVED' && !hasLinkedOrder && order?.latestQuotedPrice != null;
  const showAwaitingPayment = hasLinkedOrder && !isPaid;
  const showProduction = hasLinkedOrder && isPaid;
  const fileVersions = order?.versions || order?.quoteFileVersions || [];
  const timelineSteps = order?.timeline?.length > 0 ? order.timeline : null;

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
    : (STATUS_LABEL[order?.status] || order?.status);

  const headerStatusStyle = showProduction
    ? { background: '#eff6ff', color: '#2563eb' }
    : statusColor(order?.status);

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
        {hasConfirmedDraft && !order.isLocked && (
          <button onClick={handleLockConversation} disabled={processing}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #dc2626', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            KHOA CUOC TRO CHUYEN
          </button>
        )}
        {showProduction && linkedOrderId && (
          <Link
            to={`/orders/${linkedOrderId}`}
            style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
          >
            Xem đơn {order.linkedOrderCode ? `#${order.linkedOrderCode}` : ''}
          </Link>
        )}
        {/* Chỉ cho hủy khi: chưa bị cancelled, chưa vào sản xuất, và đơn dịch vụ chưa được thanh toán */}
        {order.status !== 'CANCELLED' && !showProduction && !isPaid && ['SUBMITTED', 'PENDING', 'APPROVED'].includes(order.status?.toUpperCase?.() || order.status) && (
          <button onClick={handleCancel} disabled={processing}
            style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {showAwaitingPayment ? 'Hủy đơn hàng' : 'Hủy yêu cầu'}
          </button>
        )}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* CHAT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages list */}
          <div ref={messagesContainerRef}
            style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

{/* Messages + inline quotes */}
            {order.messages?.length > 0 ? order.messages.map((msg, i) => {
              const isMe = getMessageAuthorId(msg) === user?.id;
              const isQuote = msg.logType && msg.logType.toUpperCase().includes('QUOTE');

              if (isQuote) {
                let meta = null;
                try { meta = msg.metadataJson ? JSON.parse(msg.metadataJson) : null; } catch {}
                const isLatestQuote = i === order.messages.length - 1;
                const canApprove =
                  (order.status === 'QUOTED' || order.status === 'NEGOTIATING') && isLatestQuote;
                return (
                  <div key={msg.id || i} style={{ width: '100%', marginBottom: 12 }}>
                    <QuoteMessageCard
                      meta={meta}
                      staffNote={msg.content}
                      revision={meta?.revision}
                      showApprove={canApprove}
                      onApprove={handleApprove}
                      approveLoading={processing}
                    />
                    <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, display: 'block' }}>
                      {new Date(msg.created).toLocaleString('vi-VN')} · Nhân viên
                    </span>
                  </div>
                );
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
              Cuoc tro chuyen da duoc khoa.
            </div>
          ) : order.status === 'CANCELLED' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
              Yêu cầu đã bị hủy.
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
          ) : order.status === '__APPROVED_CHAT_BLOCK_DISABLED__' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
              Yêu cầu đã duyệt. Liên hệ shop nếu cần hỗ trợ đơn hàng.
            </div>
          ) : (
            <ChatComposer
              value={chatMessage}
              onChange={setChatMessage}
              onSend={handleSendChat}
              uploading={uploading}
            />
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
              {(timelineSteps || CUSTOM_STATUS_STEPS.map(s => ({ code: s.key, label: s.label }))).map((step, idx, arr) => {
                const stepCode = step.code || step.key;
                let isDone;
                let isCurrent;
                if (timelineSteps) {
                  isDone = Boolean(step.isDone);
                  isCurrent = Boolean(step.isCurrent);
                } else {
                  const currentIdx = STATUS_ORDER.indexOf(order.status);
                  isDone = idx < currentIdx || (idx === currentIdx && order.status !== 'CANCELLED');
                  isCurrent = idx === currentIdx && order.status !== 'CANCELLED';
                }
                return (
                  <li key={stepCode || idx} style={{ display: 'flex', gap: 12, paddingBottom: idx < arr.length - 1 ? 16 : 0, position: 'relative' }}>
                    {idx < arr.length - 1 && (
                      <div style={{ position: 'absolute', left: 11, top: 24, width: 2, bottom: 0, background: isDone ? '#4f46e5' : '#e5e7eb' }} />
                    )}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      background: isCurrent ? '#4f46e5' : isDone ? '#4f46e5' : '#f3f4f6',
                      color: isDone || isCurrent ? '#fff' : '#9ca3af',
                      border: isCurrent ? '2px solid #a5b4fc' : 'none',
                      zIndex: 1
                    }}>
                      {isDone && !isCurrent ? '✓' : idx + 1}
                    </div>
                    <p style={{ margin: 'auto 0', fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#4f46e5' : isDone ? '#111827' : '#9ca3af' }}>
                      {step.label}
                    </p>
                  </li>
                );
              })}
              {!timelineSteps && order.status === 'CANCELLED' && (
                <li style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#dc2626' }}>✕</div>
                  <p style={{ margin: 'auto 0', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Đã hủy</p>
                </li>
              )}
            </ul>
          </div>

          {/* Design service fee */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              Phi dich vu thiet ke
            </p>
            {serviceRows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {serviceRows.map((item) => (
                  <div key={item.id} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {item.groupName || 'Dich vu'} x {item.quantity}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                      {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span>Tong</span>
                  <span>{formatPrice(order.designServiceTotalAmount || serviceTotal)}</span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af' }}>Chua co noi dung dich vu da chon.</p>
                {!designFeeOrderId && (
                  <Button block onClick={() => setServicePickerOpen(true)}>
                    Chon dich vu thiet ke
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
                {designFeeOrderId ? 'Thanh toan phi dich vu thiet ke' : 'Tao don thanh toan phi thiet ke'}
              </Button>
            ) : (
              <div style={{ marginTop: 12, color: '#059669', fontSize: 12, fontWeight: 700 }}>
                Da thanh toan phi dich vu thiet ke
              </div>
            )}
          </div>

          {/* Technical drafts */}
          {technicalDrafts.length > 0 && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Bao gia ky thuat
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {technicalDrafts.map((draft) => {
                  const draftId = draft.id || draft.Id;
                  const isConfirmedDraft = draft.isConfirmed || draft.IsConfirmed;
                  const unitPrice = draft.unitPrice ?? draft.UnitPrice ?? draft.finalPrice ?? draft.FinalPrice ?? draft.price ?? draft.Price;
                  return (
                    <div key={draftId} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                        {draft.name || draft.designWorkName || draft.DesignWorkName || 'Bao gia'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                        {draft.materialName || draft.MaterialName || 'Vat lieu'} - {draft.estimatedWeightPerUnit || draft.EstimatedWeightPerUnit || 0}g
                      </div>
                      <div style={{ fontSize: 16, color: '#065f46', fontWeight: 800, marginTop: 6 }}>
                        {formatPrice(unitPrice)}
                      </div>
                      {isConfirmedDraft ? (
                        <div style={{ marginTop: 8, color: '#059669', fontSize: 12, fontWeight: 800 }}>
                          Bao gia thanh cong
                        </div>
                      ) : (
                        <Button
                          block
                          type="primary"
                          loading={processing}
                          style={{ marginTop: 8, background: '#059669', borderColor: '#059669', fontWeight: 700 }}
                          onClick={() => handleConfirmTechnicalDraft(draft)}
                        >
                          Duyet bao gia
                        </Button>
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
              <p style={{ margin: '0 0 12px', fontSize: 11, color: '#9ca3af' }}>Revision {order.quoteRevision}</p>
              
              {(order.status === 'QUOTED' || order.status === 'NEGOTIATING') && (
                <Button type="primary" style={{ background: '#059669', borderColor: '#059669', width: '100%' }}
                  onClick={handleApprove} loading={processing}>
                  ✓ Chấp nhận báo giá
                </Button>
              )}

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
      <Modal
        open={servicePickerOpen}
        title="Chon dich vu thiet ke"
        onCancel={() => setServicePickerOpen(false)}
        onOk={() => setServicePickerOpen(false)}
        okText="Luu lua chon"
        cancelText="Dong"
        width={760}
      >
        <ServiceOptionPicker value={pendingServiceSelections} onChange={handlePendingServiceChange} />
      </Modal>
    </div>
  );
};

export default CustomOrderDetail;
