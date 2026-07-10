import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Spin, message, Modal, Button, Select } from "antd";
import { getDesignRequestDetail, assignStaffToRequest, managerAssignStaff, getMainflow2StaffList, submitQuote, postDesignRequestMessage, cancelDesignRequest, uploadFile, completeDesign, isDirectPrintSourceType } from "../../api/mainflow2Api";
import { useAuth } from "../../contexts/AuthContext";
import useMainflow2Realtime from "../../hooks/useMainflow2Realtime";
import CustomerRequestPanel from "../../components/Mainflow2/CustomerRequestPanel";
import StaffQuoteModal from "../../components/Mainflow2/StaffQuoteModal";
import StaffDesignDeliverableModal from "../../components/Mainflow2/StaffDesignDeliverableModal";
import QuoteMessageCard from "../../components/Mainflow2/QuoteMessageCard";
import DesignDeliverableCard from "../../components/Mainflow2/DesignDeliverableCard";
import ChatMessageBubble, { ChatComposer } from "../../components/Mainflow2/ChatMessageBubble";
import { getMessageAuthorId } from "../../components/Mainflow2/messageMetadataUtils";
import Model3DPreview from "../../components/Mainflow2/Model3DPreview";

const CUSTOM_STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Gửi yêu cầu' },
  { key: 'ASSIGNED', label: 'Đã phân công' },
  { key: 'QUOTED', label: 'Báo giá thiết kế + in' },
  { key: 'NEGOTIATING', label: 'Thương lượng' },
  { key: 'APPROVED', label: 'Đã duyệt' },
];

const STATUS_ORDER = CUSTOM_STATUS_STEPS.map(s => s.key);

const STATUS_LABEL = {
  SUBMITTED: 'Mới gửi',
  ASSIGNED: 'Đã nhận việc',
  QUOTED: 'Báo giá thiết kế + in',
  NEGOTIATING: 'Đang thương lượng',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
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

const StaffCustomOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Chat
  const [chatMessage, setChatMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [order?.messages]);

  // Quote panel
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const isManager = ['manager', 'admin'].includes(String(user?.role || '').toLowerCase());

  useEffect(() => {
    if (!isManager) return;
    (async () => {
      try {
        const res = await getMainflow2StaffList();
        setStaffList(Array.isArray(res?.data) ? res.data : []);
      } catch {
        /* manager-only */
      }
    })();
  }, [isManager]);

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

  useMainflow2Realtime(id, () => fetchDetail(true));

  const handleAssign = () => {
    Modal.confirm({
      title: 'Tiếp nhận yêu cầu',
      content: 'Bạn xác nhận phụ trách đơn này?',
      okText: 'Xác nhận',
      onOk: async () => {
        try {
          setProcessing(true);
          const res = await assignStaffToRequest(id);
          if (res?.statusCode === 200) { message.success('Đã nhận việc!'); fetchDetail(); }
          else message.error(res?.message || 'Lỗi khi nhận việc');
        } catch { message.error('Lỗi khi tiếp nhận'); }
        finally { setProcessing(false); }
      }
    });
  };

  const handleManagerAssign = async () => {
    if (!selectedStaffId) {
      message.warning('Chọn nhân viên để giao việc');
      return;
    }
    try {
      setProcessing(true);
      const res = await managerAssignStaff(id, selectedStaffId);
      if (res?.statusCode === 200) {
        message.success('Đã giao việc cho nhân viên!');
        fetchDetail();
      } else message.error(res?.message || 'Giao việc thất bại');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Giao việc thất bại');
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

  const handleSubmitQuote = async (payload) => {
    try {
      setProcessing(true);
      const res = await submitQuote(id, payload);
      if (res?.statusCode === 200) {
        message.success('Báo giá thành công!');
        setQuoteModalOpen(false);
        fetchDetail();
      } else message.error(res?.message || 'Lỗi gửi báo giá');
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.data || 'Lỗi báo giá');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitDesignDeliverable = async ({ deliverableFileUrl, note }) => {
    try {
      setProcessing(true);
      const res = await completeDesign(id, { deliverableFileUrl, note });
      if (res?.statusCode === 200) {
        message.success('Đã gửi bảng thiết kế!');
        setDeliverableModalOpen(false);
        fetchDetail();
      } else message.error(res?.message || 'Thất bại');
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.data || 'Thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    const designWorkId = order?.id || id;
    if (!designWorkId) {
      message.error('Thiếu mã yêu cầu — không thể hủy.');
      return;
    }
    Modal.confirm({
      title: 'Hủy yêu cầu',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Hủy yêu cầu',
      okType: 'danger',
      cancelText: 'Bỏ qua',
      onOk: async () => {
        try {
          setProcessing(true);
          const res = await cancelDesignRequest(designWorkId);
          if (res?.statusCode === 200) { message.success('Đã hủy!'); fetchDetail(); }
          else message.error(res?.message || 'Lỗi khi hủy');
        } catch { message.error('Lỗi khi hủy'); }
        finally { setProcessing(false); }
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

  const fileVersions = order?.versions || order?.quoteFileVersions || [];
  const isDirectPrintFlow = isDirectPrintSourceType(order?.sourceType);
  const isPaid = order?.linkedPaymentStatus === 'PAID';
  const isDeposited = order?.linkedPaymentStatus === 'PARTIALLY_PAID';
  const designReady = Boolean(order?.designReadyForBalance);
  const showDesigningPhase = !isDirectPrintFlow && isDeposited && !isPaid && !designReady;
  const showAwaitingBalance = !isDirectPrintFlow && isDeposited && designReady && !isPaid;
  const showProduction = isPaid;

  if (!order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <h2 style={{ fontWeight: 700, color: '#111827' }}>Không tìm thấy yêu cầu</h2>
        <Link to="/staff/custom-orders" style={{ color: '#4f46e5' }}>Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>

      {/* TOPBAR */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/staff/custom-orders"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', color: '#374151', textDecoration: 'none', fontSize: 16 }}>
          ←
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>#{order.id?.slice(0, 8)}</p>
        </div>
        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...statusColor(order.status) }}>
          {STATUS_LABEL[order.status] || order.status}
        </span>
        {order.status !== 'CANCELLED' && order.status !== 'APPROVED' && (
          <button onClick={handleCancel} disabled={processing}
            style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Hủy yêu cầu
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

            {(order.requirementBrief || order.initialIdeaImageUrls?.length || order.customerFileUrl) && (
              <div
                style={{
                  flexShrink: 0,
                  padding: '14px 16px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 12,
                  marginBottom: 4,
                }}
              >
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Yêu cầu & hình tham khảo từ khách
                </p>
                <CustomerRequestPanel order={order} />
              </div>
            )}

            {/* Messages + inline quotes */}
            {order.messages?.length > 0 ? order.messages.map((msg, i) => {
              const isMe = getMessageAuthorId(msg) === user?.id;
              const isQuote = msg.logType && msg.logType.toUpperCase().includes('QUOTE');
              const isDesignDeliverable = isDesignDeliverableLog(msg.logType);

              if (isQuote) {
                let meta = null;
                try { meta = msg.metadataJson ? JSON.parse(msg.metadataJson) : null; } catch { }
                return (
                  <div key={msg.id || i} style={{ width: '100%', marginBottom: 12 }}>
                    <QuoteMessageCard
                      meta={meta}
                      staffNote={msg.content}
                      revision={meta?.revision}
                    />
                    <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, display: 'block' }}>
                      {new Date(msg.created).toLocaleString('vi-VN')} · Nhân viên
                    </span>
                  </div>
                );
              }

              if (isDesignDeliverable) {
                let meta = null;
                try { meta = msg.metadataJson ? JSON.parse(msg.metadataJson) : null; } catch { }
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
                  otherLabel="Khách"
                />
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>Chưa có tin nhắn nào. Hãy bắt đầu trao đổi!</div>
            )}
          </div>

          {/* Composer */}
          {order.status === 'SUBMITTED' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center' }}>
              {isManager ? (
                <>
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: 13 }}>Manager giao việc cho nhân viên</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Select
                      placeholder="Chọn nhân viên"
                      style={{ minWidth: 220, textAlign: 'left' }}
                      value={selectedStaffId}
                      onChange={setSelectedStaffId}
                      options={staffList.map((s) => ({ value: s.staffId, label: s.fullName || s.username }))}
                    />
                    <Button type="primary" style={{ background: '#4f46e5' }} onClick={handleManagerAssign} loading={processing}>
                      Giao việc
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: 13 }}>Bạn chưa nhận việc. Tiếp nhận để bắt đầu trao đổi.</p>
                  <Button type="primary" style={{ background: '#4f46e5' }} onClick={handleAssign} loading={processing}>Tiếp nhận xử lý</Button>
                </>
              )}
            </div>
          ) : order.status === 'CANCELLED' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
              Yêu cầu đã bị hủy.
            </div>
          ) : order.status === 'APPROVED' && showProduction ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#2563eb', fontSize: 13, fontWeight: 600 }}>
              Khách đã thanh toán đủ — theo dõi sản xuất tại hàng đợi in
            </div>
          ) : order.status === 'APPROVED' && showAwaitingBalance ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#d97706', fontSize: 13, fontWeight: 600 }}>
              Đã gửi bảng thiết kế — chờ khách hoàn tất thanh toán
            </div>
          ) : order.status === 'APPROVED' && showDesigningPhase ? (
            <>
              <div style={{ flexShrink: 0, background: '#faf5ff', borderTop: '1px solid #e9d5ff', padding: '10px 16px', textAlign: 'center', color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>
                Khách đã cọc 30% — gửi bảng thiết kế (GLB) cho khách duyệt
              </div>
              <ChatComposer
                value={chatMessage}
                onChange={setChatMessage}
                onSend={handleSendChat}
                uploading={uploading}
                extraLeft={
                  <Button
                    type="primary"
                    loading={processing}
                    onClick={() => setDeliverableModalOpen(true)}
                    style={{ flexShrink: 0, background: '#7c3aed', borderColor: '#7c3aed', fontWeight: 600 }}
                  >
                    Gửi bảng thiết kế
                  </Button>
                }
              />
            </>
          ) : order.status === 'APPROVED' ? (
            <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#059669', fontSize: 13, fontWeight: 600 }}>
              🎉 Khách đã duyệt! Giá cuối: {formatPrice(order.latestQuotedPrice)}
            </div>
          ) : (
            <ChatComposer
              value={chatMessage}
              onChange={setChatMessage}
              onSend={handleSendChat}
              uploading={uploading}
              extraLeft={
                ['ASSIGNED', 'QUOTED', 'NEGOTIATING'].includes(order.status) ? (
                  <Button
                    onClick={() => setQuoteModalOpen(true)}
                    style={{ flexShrink: 0, background: '#ecfdf5', borderColor: '#6ee7b7', color: '#059669', fontWeight: 600 }}
                  >
                    💰 Báo giá thiết kế + in
                  </Button>
                ) : null
              }
            />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              Yêu cầu khách
            </p>
            <CustomerRequestPanel order={order} compact />
          </div>

          {/* Timeline */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Tiến trình</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {CUSTOM_STATUS_STEPS.map((step, idx) => {
                const currentIdx = STATUS_ORDER.indexOf(order.status);
                const isDone = idx < currentIdx || (idx === currentIdx && order.status !== 'CANCELLED');
                const isCurrent = idx === currentIdx && order.status !== 'CANCELLED';
                return (
                  <li key={step.key} style={{ display: 'flex', gap: 12, paddingBottom: idx < CUSTOM_STATUS_STEPS.length - 1 ? 16 : 0, position: 'relative' }}>
                    {idx < CUSTOM_STATUS_STEPS.length - 1 && (
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
              {order.status === 'CANCELLED' && (
                <li style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#dc2626' }}>✕</div>
                  <p style={{ margin: 'auto 0', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Đã hủy</p>
                </li>
              )}
            </ul>
          </div>

          {/* Quote summary */}
          {order.latestQuotedPrice != null && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Báo giá</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#065f46' }}>{formatPrice(order.latestQuotedPrice)}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>Revision {order.quoteRevision}</p>
            </div>
          )}

          {/* 3D preview */}
          {(order.latestQuotePreviewUrl || order.customerFileUrl) && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Xem trước 3D
              </p>
              <Model3DPreview fileUrl={order.latestQuotePreviewUrl || order.customerFileUrl} height={160} />
            </div>
          )}

          {/* File versions */}
          {fileVersions.length > 0 && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Bản thiết kế (NV)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fileVersions.map((f, i) => (
                  <div key={i}>
                    <Model3DPreview fileUrl={f.fileUrl || f.url} height={120} />
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
                      {f.title || `File v${f.versionNumber}`} · v{f.versionNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer info */}
          <div style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Khách hàng</p>
            {order.customerName && (
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{order.customerName}</p>
            )}
            <p style={{ margin: 0, fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', wordBreak: 'break-all' }}>{order.customerId}</p>
          </div>
        </div>
      </div>

      <StaffQuoteModal
        open={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        onSubmit={handleSubmitQuote}
        submitting={processing}
        designWorkTitle={order.title}
      />

      <StaffDesignDeliverableModal
        open={deliverableModalOpen}
        onClose={() => setDeliverableModalOpen(false)}
        onSubmit={handleSubmitDesignDeliverable}
        submitting={processing}
      />
    </div>
  );
};

export default StaffCustomOrderDetail;
