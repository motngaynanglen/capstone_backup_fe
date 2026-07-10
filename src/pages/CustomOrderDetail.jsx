import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Spin, message, Modal, Button } from 'antd';
import { getDesignRequestDetail, approveQuote, cancelDesignRequest, postDesignRequestMessage, uploadFile, isDirectPrintSourceType } from '../api/mainflow2Api';
import { cancelOrderApi } from '../api/orderApi';
import { useAuth } from '../contexts/AuthContext';
import useMainflow2Realtime from '../hooks/useMainflow2Realtime';
import QuoteMessageCard from '../components/Mainflow2/QuoteMessageCard';
import DesignDeliverableCard from '../components/Mainflow2/DesignDeliverableCard';
import ChatMessageBubble, { ChatComposer } from '../components/Mainflow2/ChatMessageBubble';
import { getMessageAuthorId } from '../components/Mainflow2/messageMetadataUtils';
import Model3DPreview from '../components/Mainflow2/Model3DPreview';

const CUSTOM_STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Gửi yêu cầu' },
  { key: 'ASSIGNED', label: 'NV đã nhận' },
  { key: 'QUOTED', label: 'Báo giá thiết kế + in' },
  { key: 'NEGOTIATING', label: 'Thương lượng' },
  { key: 'APPROVED', label: 'Đã duyệt' },
];

const STATUS_ORDER = CUSTOM_STATUS_STEPS.map(s => s.key);

const STATUS_LABEL = {
  SUBMITTED: 'Mới gửi',
  ASSIGNED: 'NV đã nhận',
  QUOTED: 'Báo giá thiết kế + in',
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

const directPrintPayHint = (sourceType) => {
  const t = String(sourceType || '').toUpperCase();
  if (t === 'AI_GENERATED') return 'Thanh toán một lần — AI đã tạo mẫu, vào sản xuất ngay sau thanh toán.';
  if (t === 'REPRINT_MF2') return 'Thanh toán một lần — vào sản xuất ngay, không cần chat.';
  return 'Thanh toán một lần — file thiết kế đã có, vào sản xuất ngay sau thanh toán.';
};

const checkoutNamePrefix = (sourceType) => {
  const t = String(sourceType || '').toUpperCase();
  if (t === 'AI_GENERATED') return 'In AI';
  if (t === 'PRINT_FROM_DESIGN_MF2') return 'In';
  if (t === 'REPRINT_MF2') return 'In lại';
  return 'In';
};

const goToDesignCheckout = (navigate, order) => {
  const isDirectPrint = isDirectPrintSourceType(order?.sourceType);
  const prefix = checkoutNamePrefix(order?.sourceType);
  const state = {
    designWorkId: order.id,
    designWorkSourceType: order.sourceType || 'CUSTOM_QUOTE_MF2',
    designWorkName: order.title
      ? (isDirectPrint ? `${prefix}: ${order.title}` : `Thiết kế: ${order.title}`)
      : (isDirectPrint ? 'In sản phẩm' : 'Thiết kế theo yêu cầu'),
    designWorkPrice: order.latestQuotedPrice,
    designWorkDesignFee: isDirectPrint ? 0 : (order.latestQuoteDesignFee ?? 0),
    returnTo: `/custom-orders/${order.id}`,
  };
  navigate('/checkout', { state });
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const statusColor = (status) => {
  if (status === 'SUBMITTED') return { background: '#f3f4f6', color: '#6b7280' };
  if (status === 'ASSIGNED') return { background: '#eff6ff', color: '#2563eb' };
  if (status === 'QUOTED') return { background: '#f5f3ff', color: '#7c3aed' };
  if (status === 'NEGOTIATING') return { background: '#fffbeb', color: '#d97706' };
  if (status === 'APPROVED') return { background: '#ecfdf5', color: '#059669' };
  return { background: '#fef2f2', color: '#dc2626' };
};

const isDesignDeliverableLog = (logType) =>
  String(logType || '').toUpperCase().includes('DESIGN_READY');

const CustomOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDetail(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchDetail]);

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
  const isDirectPrintFlow = isDirectPrintSourceType(order?.sourceType);
  const isPaid = order?.linkedPaymentStatus === 'PAID';
  const isDeposited = order?.linkedPaymentStatus === 'PARTIALLY_PAID';
  const designReady = Boolean(order?.designReadyForBalance);
  const hasLinkedOrder = Boolean(linkedOrderId);
  const showPayButtons = order?.status === 'APPROVED' && !hasLinkedOrder;
  const showAwaitingPayment = hasLinkedOrder && !isPaid && !isDeposited;
  const showDesigningPhase = !isDirectPrintFlow && isDeposited && !isPaid && !designReady;
  const showPayBalance = !isDirectPrintFlow && isDeposited && designReady && !isPaid;
  const showProduction = hasLinkedOrder && isPaid;
  const fileVersions = order?.versions || order?.quoteFileVersions || [];
  const timelineSteps = order?.timeline?.length > 0 ? order.timeline : null;

  const headerStatusLabel = showProduction
      ? (order.linkedOrderStatus === 'FINISHED' || order.linkedShipmentStatus === 'READY_FOR_PICKUP'
      ? (LINKED_ORDER_STATUS_LABEL.READY_FOR_SHIP ?? 'Sẵn sàng giao (chờ GHN)')
      : order.linkedShipmentStatus === 'IN_TRANSIT'
        ? 'Đang giao hàng'
        : order.linkedOrderStatus === 'PROCESSING' || order.linkedShipmentStatus === 'PREPARING'
          ? 'Đang sản xuất / in 3D'
          : SHIPMENT_STATUS_LABEL[order.linkedShipmentStatus]
            || LINKED_ORDER_STATUS_LABEL[order.linkedOrderStatus]
            || 'Đang xử lý đơn')
    : showPayBalance
      ? 'Chờ hoàn tất thanh toán'
      : showDesigningPhase
        ? 'Chờ bảng thiết kế'
    : (STATUS_LABEL[order?.status] || order?.status);

  const headerStatusStyle = showProduction
    ? { background: '#eff6ff', color: '#2563eb' }
    : showPayBalance
      ? { background: '#fffbeb', color: '#d97706' }
      : showDesigningPhase
        ? { background: '#f5f3ff', color: '#7c3aed' }
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
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>#{order.id?.slice(0, 8)}</p>
        </div>
        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...headerStatusStyle }}>
          {headerStatusLabel}
        </span>
        {showProduction && linkedOrderId && (
          <Link
            to={`/orders/${linkedOrderId}`}
            style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
          >
            Xem đơn {order.linkedOrderCode ? `#${order.linkedOrderCode}` : ''}
          </Link>
        )}
        {(showPayBalance || showDesigningPhase) && linkedOrderId && (
          <Link
            to={`/orders/${linkedOrderId}`}
            style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textDecoration: 'none' }}
          >
            Đơn {order.linkedOrderCode ? `#${order.linkedOrderCode}` : ''}
          </Link>
        )}
        {order.status !== 'CANCELLED' && !showProduction && (
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
              const isDesignDeliverable = isDesignDeliverableLog(msg.logType);

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

              if (isDesignDeliverable) {
                let meta = null;
                try { meta = msg.metadataJson ? JSON.parse(msg.metadataJson) : null; } catch {}
                return (
                  <div key={msg.id || i} style={{ width: '100%', marginBottom: 12 }}>
                    <DesignDeliverableCard meta={meta} staffNote={msg.content} />
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
          {order.status === 'CANCELLED' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
              Yêu cầu đã bị hủy.
            </div>
          ) : showProduction ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', color: '#2563eb', fontSize: 14, fontWeight: 700 }}>
                Đã thanh toán đủ — đang theo dõi tiến độ sản xuất & giao hàng
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                {order.linkedTrackingNumber
                  ? `Mã vận đơn: ${order.linkedTrackingNumber}`
                  : 'Shop sẽ cập nhật trạng thái khi bắt đầu in và giao hàng.'}
              </p>
            </div>
          ) : showPayBalance ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#d97706', fontSize: 14, fontWeight: 600 }}>
                Bảng thiết kế đã sẵn sàng — hoàn tất thanh toán để bắt đầu sản xuất
              </div>
              {order.remainingBalance != null && (
                <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                  Số tiền còn lại: <strong>{formatPrice(order.remainingBalance)}</strong>
                </p>
              )}
              <Button
                type="primary"
                size="large"
                style={{ background: '#4f46e5', borderColor: '#4f46e5', height: 44, borderRadius: 12, fontWeight: 700 }}
                onClick={() => navigate(`/orders/${linkedOrderId}`, { state: { returnTo: `/custom-orders/${order.id}` } })}
              >
                Hoàn tất thanh toán
              </Button>
            </div>
          ) : showDesigningPhase ? (
            <>
              <div style={{ flexShrink: 0, background: '#faf5ff', borderTop: '1px solid #e9d5ff', padding: '10px 16px', textAlign: 'center', color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>
                Đã đặt cọc 30% — chờ nhân viên gửi bảng thiết kế trong chat
              </div>
              <ChatComposer
                value={chatMessage}
                onChange={setChatMessage}
                onSend={handleSendChat}
                uploading={uploading}
              />
            </>
          ) : showAwaitingPayment ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#d97706', fontSize: 14, fontWeight: 600 }}>
                {isDirectPrintFlow
                  ? 'Chờ thanh toán toàn bộ để bắt đầu in'
                  : 'Đã duyệt báo giá — vui lòng đặt cọc 30% để bắt đầu'}
              </div>
              <Button
                type="primary"
                size="large"
                style={{ background: '#4f46e5', borderColor: '#4f46e5', height: 44, borderRadius: 12, fontWeight: 700 }}
                onClick={() => navigate(`/orders/${linkedOrderId}`, { state: { returnTo: `/custom-orders/${order.id}` } })}
              >
                {isDirectPrintFlow ? 'Thanh toán & in ngay' : 'Đặt cọc 30%'}
              </Button>
            </div>
          ) : showPayButtons ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#059669', fontSize: 14, fontWeight: 600 }}>
                {isDirectPrintFlow
                  ? 'Đã duyệt báo giá — thanh toán toàn bộ để in ngay'
                  : `🎉 Đã duyệt báo giá thiết kế + in: ${formatPrice(order.latestQuotedPrice)}`}
              </div>
              <Button
                type="primary"
                size="large"
                style={{ background: '#4f46e5', borderColor: '#4f46e5', height: 48, borderRadius: 12, padding: '0 32px', fontWeight: 700, fontSize: 16 }}
                onClick={() => goToDesignCheckout(navigate, order)}
              >
                {isDirectPrintFlow ? 'Thanh toán & in ngay' : 'Đặt cọc 30%'}
              </Button>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                {isDirectPrintFlow
                  ? directPrintPayHint(order?.sourceType)
                  : (order.latestQuoteDesignFee > 0
                    ? `Cọc ${formatPrice(Math.round(order.latestQuoteDesignFee * 0.3))} (30% tiền thiết kế) — sau bảng thiết kế hoàn tất phần còn lại tổng đơn.`
                    : 'Cọc 30% tiền thiết kế — sau bảng thiết kế hoàn tất phần còn lại tổng đơn.')}
              </p>
            </div>
          ) : order.status === 'APPROVED' ? (
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
                  {isDirectPrintFlow ? 'Thanh toán & in ngay' : '🚀 Thanh toán ngay'}
                </Button>
              )}
              {showAwaitingPayment && (
                <Button
                  type="primary"
                  style={{ background: '#d97706', borderColor: '#d97706', width: '100%', fontWeight: 700 }}
                  onClick={() => navigate(`/orders/${linkedOrderId}`)}
                >
                  {isDirectPrintFlow ? 'Thanh toán & in ngay' : 'Hoàn tất thanh toán'}
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
            <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all' }}>{order.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomOrderDetail;
