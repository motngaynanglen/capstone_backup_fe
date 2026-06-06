import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Spin, message, Modal, Button } from "antd";
import { getDesignRequestDetail, assignStaffToRequest, submitQuote, postDesignRequestMessage, cancelDesignRequest, uploadFile, getDesignVersions, reviewFileVersion, reviewAdjustment, createVersionUpdateLog, getTechnicalDraftsByDesignWork } from "../../api/mainflow2Api";
import AdjustmentRequestCard from "../../components/Mainflow2/AdjustmentRequestCard";
import TechnicalDraftCard from "../../components/Mainflow2/TechnicalDraftCard";
import VersionUpdateCard from "../../components/Mainflow2/VersionUpdateCard";
import { useAuth } from "../../contexts/AuthContext";
import useMainflow2Realtime from "../../hooks/useMainflow2Realtime";
import CustomerRequestPanel from "../../components/Mainflow2/CustomerRequestPanel";
import StaffQuoteModal from "../../components/Mainflow2/StaffQuoteModal";
import ChatMessageBubble, { ChatComposer } from "../../components/Mainflow2/ChatMessageBubble";
import { getMessageAuthorId } from "../../components/Mainflow2/messageMetadataUtils";
import Model3DPreview from "../../components/Mainflow2/Model3DPreview";

/**
 * Build timeline steps based on real BE designWorkStatus + payment.
 *
 * BE statuses: SKETCHING → PENDING → IN_PROGRESS → REVIEWING → COMPLETED
 * Nhưng thực tế PENDING chỉ là trạng thái trung gian, DesignWork thường ở
 * SKETCHING cho tới khi staff tiếp nhận (→ IN_PROGRESS).
 *
 * Timeline 5 bước hiển thị cho staff:
 * 1. Gửi yêu cầu     — luôn done
 * 2. Thanh toán phí TK — done khi paid
 * 3. Tiếp nhận         — done khi IN_PROGRESS+
 * 4. Báo giá           — done khi REVIEWING+
 * 5. Hoàn tất          — done khi COMPLETED
 */
const isWorkTypePrint = (order) =>
  ['PRINT_SERVICE', 'CUSTOM_FILE_PRINT_MF2'].includes(order?.workType || order?.WorkType || '');

function buildStaffTimeline(order) {
  const raw = order?.designWorkStatus || '';
  const isPrint = isWorkTypePrint(order);
  // PRINT_SERVICE has no design fee — treat as always paid
  const paid = isPrint ? true : (order?.designServicePaid || order?.designServicePaymentStatus === 'PAID');

  const rankMap = { SKETCHING: 0, PENDING: 0, IN_PROGRESS: 1, REVIEWING: 2, COMPLETED: 3 };
  const rank = rankMap[raw] ?? -1;

  const step2 = isPrint
    ? { key: 'fileReview', label: rank >= 1 ? 'File đã duyệt' : 'Chờ duyệt file', done: rank >= 1, isCurrent: rank === 0 }
    : { key: 'paid', label: paid ? 'Đã thanh toán phí TK' : 'Chờ thanh toán phí TK', done: paid, isCurrent: !paid && rank === 0 };

  const steps = [
    { key: 'request', label: 'Gửi yêu cầu', done: true, isCurrent: false },
    step2,
    { key: 'assigned', label: rank >= 1 ? 'Đã tiếp nhận' : 'Chờ tiếp nhận', done: rank >= 1, isCurrent: paid && rank === 0 && !step2.isCurrent },
    { key: 'quoted', label: rank >= 2 ? 'Đã báo giá' : 'Báo giá', done: rank >= 2, isCurrent: rank === 1 },
    { key: 'completed', label: rank >= 3 ? 'Hoàn tất' : 'Chờ duyệt', done: rank >= 3, isCurrent: rank === 2 },
  ];

  if (rank < 3) {
    const hasAnyCurrent = steps.some(s => s.isCurrent);
    if (!hasAnyCurrent) {
      const firstNotDone = steps.find(s => !s.done);
      if (firstNotDone) firstNotDone.isCurrent = true;
    }
  }

  return steps;
}

// Legacy — still used for topbar badge
const CUSTOM_STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Gui yeu cau' },
  { key: 'ASSIGNED', label: 'Da phan cong' },
  { key: 'QUOTED', label: 'Da bao gia' },
  { key: 'NEGOTIATING', label: 'Thuong luong' },
  { key: 'APPROVED', label: 'Da duyet' },
];

const STATUS_ORDER = CUSTOM_STATUS_STEPS.map(s => s.key);

// Real BE status labels — no more fake FE mapping
const BE_STATUS_LABEL = {
  SKETCHING: 'Phác thảo',
  PENDING: 'Chờ tiếp nhận',
  IN_PROGRESS: 'Đang thực hiện',
  REVIEWING: 'Đang kiểm duyệt',
  COMPLETED: 'Đã nghiệm thu',
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const beStatusColor = (status) => {
  if (status === 'SKETCHING') return { background: '#f3f4f6', color: '#6b7280' };
  if (status === 'PENDING') return { background: '#fffbeb', color: '#d97706' };
  if (status === 'IN_PROGRESS') return { background: '#eff6ff', color: '#2563eb' };
  if (status === 'REVIEWING') return { background: '#f5f3ff', color: '#7c3aed' };
  if (status === 'COMPLETED') return { background: '#ecfdf5', color: '#059669' };
  return { background: '#fef2f2', color: '#dc2626' };
};

const isSuccessResponse = (res) =>
  res?.statusCode === 200 ||
  res?.success === true ||
  ['SUCCESS', 'CREATED', 'UPDATED'].includes(String(res?.code || '').toUpperCase());

const StaffCustomOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Design versions (for file review) + technical drafts
  const [designVersions, setDesignVersions] = useState([]);
  const [technicalDrafts, setTechnicalDrafts] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  // Adjustment review
  const [rejectAdjustId, setRejectAdjustId] = useState(null);
  const [rejectAdjustOpen, setRejectAdjustOpen] = useState(false);
  const [rejectAdjustNote, setRejectAdjustNote] = useState('');

  // Version upload
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionTitle, setVersionTitle] = useState('');
  const [versionNote, setVersionNote] = useState('');
  const [versionFile, setVersionFile] = useState(null);
  const [versionUploading, setVersionUploading] = useState(false);

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
  const [quoteVersionId, setQuoteVersionId] = useState(null); // designVersionHistoryId for targeted quote

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

  const fetchVersions = useCallback(async () => {
    try {
      const res = await getDesignVersions(id);
      setDesignVersions(Array.isArray(res) ? res : res?.data || []);
    } catch { /* silent */ }
  }, [id]);

  const fetchDrafts = useCallback(async () => {
    try {
      const drafts = await getTechnicalDraftsByDesignWork(id);
      setTechnicalDrafts(Array.isArray(drafts) ? drafts : []);
    } catch { setTechnicalDrafts([]); }
  }, [id]);

  useEffect(() => {
    fetchDetail();
    fetchVersions();
    fetchDrafts();
  }, [id]);

  useMainflow2Realtime(id, () => { fetchDetail(true); fetchVersions(); fetchDrafts(); });

  const handleReviewFile = async (versionId, isApproved, reviewNote = '') => {
    try {
      setProcessing(true);
      await reviewFileVersion(versionId, {
        ReviewStatus: isApproved ? 'ACCEPTED' : 'REJECTED',
        ReviewNote: reviewNote || undefined,
      });
      message.success(isApproved ? 'Đã duyệt file' : 'Đã từ chối file');
      fetchDetail(true);
      fetchVersions();
    } catch (err) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Lỗi khi review file');
    } finally {
      setProcessing(false);
      setRejectModalOpen(false);
      setRejectNote('');
      setReviewingId(null);
    }
  };

  const handleApproveAdjustment = async (logId) => {
    try {
      setProcessing(true);
      await reviewAdjustment(logId, { isApproved: true });
      message.success('Da dong y yeu cau hieu chinh');
      fetchDetail(true);
    } catch (err) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Loi khi duyet yeu cau');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectAdjustment = async () => {
    if (!rejectAdjustNote.trim()) {
      message.warning('Vui long nhap ly do tu choi');
      return;
    }
    try {
      setProcessing(true);
      await reviewAdjustment(rejectAdjustId, { isApproved: false, decisionNote: rejectAdjustNote });
      message.success('Da tu choi yeu cau hieu chinh');
      fetchDetail(true);
    } catch (err) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Loi khi tu choi');
    } finally {
      setProcessing(false);
      setRejectAdjustOpen(false);
      setRejectAdjustNote('');
      setRejectAdjustId(null);
    }
  };

  const handleUploadVersion = async () => {
    if (!versionFile) { message.warning('Vui long chon file 3D'); return; }
    try {
      setVersionUploading(true);
      // 1. Upload file to storage
      const up = await uploadFile(versionFile);
      const fileUrl = up?.data?.publicUrl || up?.data?.url || up?.publicUrl || up?.url;
      if (!fileUrl) { message.error('Upload file that bai'); return; }
      // 2. Create version update log
      await createVersionUpdateLog(order.designWorkId || id, {
        title: versionTitle.trim() || undefined,
        content: versionNote.trim() || undefined,
        fileUrl,
        isPreviewable: true,
        isPrintable: false,
      });
      message.success('Da tao phien ban thiet ke moi!');
      setVersionModalOpen(false);
      setVersionTitle('');
      setVersionNote('');
      setVersionFile(null);
      fetchDetail(true);
      fetchVersions();
      fetchDrafts();
    } catch (err) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Loi khi tao phien ban');
    } finally {
      setVersionUploading(false);
    }
  };

  const handleAssign = () => {
    Modal.confirm({
      title: 'Tiếp nhận yêu cầu',
      content: 'Bạn xác nhận phụ trách đơn này?',
      okText: 'Xác nhận',
      onOk: async () => {
        try {
          setProcessing(true);
          const res = await assignStaffToRequest(id);
          if (isSuccessResponse(res)) { message.success('Đã nhận việc!'); fetchDetail(); }
          else message.error(res?.message || 'Lỗi khi nhận việc');
        } catch { message.error('Lỗi khi tiếp nhận'); }
        finally { setProcessing(false); }
      }
    });
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
      if (isSuccessResponse(res)) {
        message.success('Báo giá thành công!');
        setQuoteModalOpen(false);
        setQuoteVersionId(null);
        fetchDetail();
        fetchDrafts();
      } else message.error(res?.message || 'Lỗi gửi báo giá');
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.data || 'Lỗi báo giá');
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
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>#{order.code || order.name || '—'}</p>
        </div>
        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...beStatusColor(order.designWorkStatus) }}>
          {order.isLocked && order.designWorkStatus !== 'COMPLETED'
            ? 'Đã đóng'
            : (BE_STATUS_LABEL[order.designWorkStatus] || order.designWorkStatus)}
        </span>
        {isWorkTypePrint(order)
          ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>In theo yêu cầu</span>
          : <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#6d28d9' }}>Thiết kế 3D</span>
        }
        {!isManager && order.designWorkStatus !== 'COMPLETED' && !order.isLocked && (
          <button onClick={handleCancel} disabled={processing}
            style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Hủy yêu cầu
          </button>
        )}
        {isManager && (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>Xem với tư cách Manager</span>
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

            {/* Messages + inline quotes + adjustment requests */}
            {order.messages?.length > 0 ? order.messages.map((msg, i) => {
              const isMe = getMessageAuthorId(msg) === user?.id;
              const logType = (msg.logType || '').toUpperCase();
              const isQuote = logType.includes('QUOTE');
              const isAdjustment = logType === 'ADJUSTMENT_REQUEST';

              if (isAdjustment) {
                return (
                  <AdjustmentRequestCard
                    key={msg.id || i}
                    msg={msg}
                    isStaff={!isManager}
                    onApprove={isManager ? undefined : handleApproveAdjustment}
                    onReject={isManager ? undefined : (logId) => { setRejectAdjustId(logId); setRejectAdjustOpen(true); }}
                    processing={processing}
                  />
                );
              }

              // VERSION_UPDATE — card đầy đủ: nội dung + 3D + nút Xem + nút Tạo báo giá.
              // Báo giá do nhân viên đưa ra → căn phải (isMe) bên của nhân viên.
              if (logType === 'VERSION_UPDATE') {
                return (
                  <VersionUpdateCard
                    key={msg.id || i}
                    msg={msg}
                    isMe={true}  // VERSION_UPDATE luôn do staff tạo (BE [Authorize StaffOrManager])
                    role={isManager ? 'manager' : 'staff'}
                    drafts={technicalDrafts}
                    isPrintService={isWorkTypePrint(order)}
                    designWorkStatus={order.designWorkStatus}
                    isLocked={order.isLocked}
                    processing={processing}
                    onCreateQuote={(versionId) => { setQuoteVersionId(versionId); setQuoteModalOpen(true); }}
                  />
                );
              }

              // Legacy QUOTE type fallback — báo giá kỹ thuật, căn phải (của nhân viên)
              if (isQuote && technicalDrafts.length > 0) {
                const latestDraft = technicalDrafts[technicalDrafts.length - 1];
                return (
                  <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <TechnicalDraftCard
                      draft={latestDraft}
                      showApprove={false}
                      senderName={isMe ? 'Tôi' : (msg.senderName || 'Nhân viên')}
                      createdAt={msg.created}
                    />
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

          {/* Composer — uses real BE designWorkStatus */}
          {(() => {
            const raw = order.designWorkStatus;
            const isPrint = isWorkTypePrint(order);
            const paid = isPrint ? true : (order.designServicePaid || order.designServicePaymentStatus === 'PAID');

            // Đã khóa thủ công — cuộc trò chuyện đóng hoàn toàn (cả khách & nhân viên)
            if (order.isLocked) {
              return (
                <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                  Cuộc trò chuyện đã được khóa.
                </div>
              );
            }

            // COMPLETED nhưng CHƯA khóa — khách vẫn nhắn được nên nhân viên cũng phải nhắn được.
            // Hiện banner nghiệm thu + vẫn cho phép gửi tin (cho tới khi khách khóa thủ công).
            if (raw === 'COMPLETED') {
              return (
                <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ padding: '8px 16px', background: '#ecfdf5', borderBottom: '1px solid #6ee7b7', textAlign: 'center', color: '#059669', fontSize: 12, fontWeight: 600 }}>
                    🎉 Khách đã duyệt thiết kế · Sản phẩm đã vào kho đồ, khách có thể đặt in tùy ý · Cuộc trò chuyện vẫn mở cho tới khi được khóa.
                  </div>
                  <ChatComposer value={chatMessage} onChange={setChatMessage} onSend={handleSendChat} uploading={uploading} />
                </div>
              );
            }

            // SKETCHING hoặc PENDING — chưa tiếp nhận
            // Thực tế DesignWork ở SKETCHING ngay cả khi đã thanh toán.
            // PENDING chỉ là trạng thái trung gian (order), hiếm khi thấy trên DesignWork.
            if (raw === 'SKETCHING' || raw === 'PENDING') {
              return (
                <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{
                    padding: '10px 16px',
                    background: paid ? '#ecfdf5' : '#fffbeb',
                    borderBottom: `1px solid ${paid ? '#6ee7b7' : '#fde68a'}`,
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  }}>
                    <span style={{ color: paid ? '#059669' : '#b45309', fontSize: 12, flex: 1, minWidth: 200 }}>
                      {isPrint
                        ? <>Khách đã <b>upload file 3D</b>. Xem xét file và bấm <b>Tiếp nhận</b> để bắt đầu báo giá.</>
                        : paid
                          ? <>Khách <b>đã thanh toán</b> phí thiết kế. Trao đổi với khách để làm rõ yêu cầu, sau đó bấm <b>Tiếp nhận</b>.</>
                          : <>Khách chưa thanh toán phí thiết kế — bạn vẫn có thể trao đổi, nhưng chỉ <b>tiếp nhận được sau khi khách thanh toán</b>.</>
                      }
                    </span>
                    {paid && !isManager && (
                      <Button type="primary" loading={processing} onClick={handleAssign} style={{ flexShrink: 0, fontWeight: 600 }}>
                        ✋ Tiếp nhận
                      </Button>
                    )}
                  </div>
                  <ChatComposer value={chatMessage} onChange={setChatMessage} onSend={handleSendChat} uploading={uploading} />
                </div>
              );
            }

            // IN_PROGRESS or REVIEWING — staff can quote + upload version (manager chỉ chat)
            return (
              <ChatComposer
                value={chatMessage}
                onChange={setChatMessage}
                onSend={handleSendChat}
                uploading={uploading}
                extraLeft={!isManager ? (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Button
                      onClick={() => setQuoteModalOpen(true)}
                      style={{ flexShrink: 0, background: '#ecfdf5', borderColor: '#6ee7b7', color: '#059669', fontWeight: 600 }}
                    >
                      💰 Báo giá
                    </Button>
                    <Button
                      onClick={() => setVersionModalOpen(true)}
                      style={{ flexShrink: 0, background: '#eff6ff', borderColor: '#93c5fd', color: '#2563eb', fontWeight: 600 }}
                    >
                      📐 Tạo phiên bản 3D
                    </Button>
                  </div>
                ) : null}
              />
            );
          })()}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              Yêu cầu khách
            </p>
            <CustomerRequestPanel order={order} compact />
          </div>

          {/* Timeline — based on actual BE status + payment */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Tien trinh</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {buildStaffTimeline(order).map((step, idx, arr) => (
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

          {/* Adjustment rounds remaining */}
          {(() => {
            const sels = order.selections || [];
            const totalLimit = sels.reduce((s, x) => s + (x.adjustmentRoundLimit || 0), 0);
            const totalRemaining = sels.reduce((s, x) => s + (x.remainingAdjustmentRoundCount || 0), 0);
            if (totalLimit <= 0) return null;
            return (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Lượt hiệu chỉnh
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: totalRemaining > 0 ? '#ecfdf5' : '#fef2f2',
                    color: totalRemaining > 0 ? '#059669' : '#dc2626',
                  }}>
                    {totalRemaining}/{totalLimit} còn lại
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    (đã dùng {totalLimit - totalRemaining})
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Design service payment */}
          {(order.designServicePaymentStatus || order.designServiceOrderCode) && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Phi dich vu thiet ke</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(() => {
                  const actuallyPaid = order.designServicePaid || order.designServicePaymentStatus === 'PAID';
                  return (
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: actuallyPaid ? '#ecfdf5' : '#fffbeb',
                      color: actuallyPaid ? '#059669' : '#d97706',
                    }}>
                      {actuallyPaid ? 'Da thanh toan' : 'Chua thanh toan'}
                    </span>
                  );
                })()}
                {order.designServiceTotalAmount != null && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                    {formatPrice(order.designServiceTotalAmount)}
                  </span>
                )}
              </div>
              {order.designServiceOrderCode && (
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b7280' }}>
                  Đơn phí: <Link to={`/staff/shop-orders/${order.designServiceOrderId}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>
                    #{order.designServiceOrderCode}
                  </Link>
                </p>
              )}
            </div>
          )}

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

          {/* File versions with review */}
          {(designVersions.length > 0 || fileVersions.length > 0) && (
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Bản thiết kế ({designVersions.length || fileVersions.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(designVersions.length > 0 ? designVersions : fileVersions).map((f, i) => {
                  const reviewStatus = f.fileReviewStatus || (f.isApproved ? 'ACCEPTED' : null);
                  const canReview = !reviewStatus || (reviewStatus !== 'ACCEPTED' && reviewStatus !== 'REJECTED');
                  return (
                    <div key={f.id || i} style={{ background: '#f9fafb', borderRadius: 8, padding: 8, border: '1px solid #e5e7eb' }}>
                      <Model3DPreview fileUrl={f.fileUrl || f.url} height={120} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#374151', fontWeight: 600, flex: 1 }}>
                          {f.title || `File v${f.versionNumber}`}
                        </p>
                        {reviewStatus === 'ACCEPTED' && (
                          <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#ecfdf5', color: '#059669' }}>Đã duyệt</span>
                        )}
                        {reviewStatus === 'REJECTED' && (
                          <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#fef2f2', color: '#dc2626' }}>Từ chối</span>
                        )}
                        {!reviewStatus && (
                          <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#fffbeb', color: '#d97706' }}>Chờ duyệt</span>
                        )}
                      </div>
                      {/* Duyệt/Từ chối file CHỈ dành cho đơn in theo yêu cầu (khách upload file, NV kiểm tra
                          tiêu chuẩn in). Trong dịch vụ thiết kế, nhân viên KHÔNG duyệt thiết kế — đó là việc của khách. */}
                      {!isManager && isWorkTypePrint(order) && canReview && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button
                            onClick={() => handleReviewFile(f.id, true)}
                            disabled={processing}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: '1px solid #6ee7b7', background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✓ Duyệt
                          </button>
                          <button
                            onClick={() => { setReviewingId(f.id); setRejectModalOpen(true); }}
                            disabled={processing}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✕ Từ chối
                          </button>
                        </div>
                      )}
                      {/* Quote button for this specific version — ẩn cho manager */}
                      {!isManager && (order.designWorkStatus === 'IN_PROGRESS' || order.designWorkStatus === 'REVIEWING') && (
                        <button
                          onClick={() => { setQuoteVersionId(f.id); setQuoteModalOpen(true); }}
                          style={{ width: '100%', marginTop: 6, padding: '4px 0', borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          💰 Báo giá phiên bản này
                        </button>
                      )}
                    </div>
                  );
                })}
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
        onClose={() => { setQuoteModalOpen(false); setQuoteVersionId(null); }}
        onSubmit={handleSubmitQuote}
        submitting={processing}
        designWorkTitle={order.title}
        designVersionHistoryId={quoteVersionId}
      />

      {/* Reject file modal */}
      <Modal
        title="Tu choi file thiet ke"
        open={rejectModalOpen}
        onOk={() => handleReviewFile(reviewingId, false, rejectNote)}
        onCancel={() => { setRejectModalOpen(false); setRejectNote(''); setReviewingId(null); }}
        okText="Xac nhan tu choi"
        okButtonProps={{ danger: true, disabled: !rejectNote.trim() }}
        cancelText="Huy"
      >
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#374151' }}>Nhap ly do tu choi file:</p>
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="VD: File bi loi mesh, thieu chi tiet..."
          rows={3}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical' }}
        />
      </Modal>

      {/* Reject adjustment modal */}
      <Modal
        title="Tu choi yeu cau hieu chinh"
        open={rejectAdjustOpen}
        onOk={handleRejectAdjustment}
        onCancel={() => { setRejectAdjustOpen(false); setRejectAdjustNote(''); setRejectAdjustId(null); }}
        okText="Xac nhan tu choi"
        okButtonProps={{ danger: true, disabled: !rejectAdjustNote.trim() }}
        cancelText="Huy"
      >
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#374151' }}>Nhap ly do tu choi yeu cau hieu chinh:</p>
        <textarea
          value={rejectAdjustNote}
          onChange={(e) => setRejectAdjustNote(e.target.value)}
          placeholder="VD: Yeu cau vuot pham vi brief ban dau..."
          rows={3}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical' }}
        />
      </Modal>

      {/* Version upload modal */}
      <Modal
        title="Tao phien ban thiet ke 3D"
        open={versionModalOpen}
        onOk={handleUploadVersion}
        onCancel={() => { setVersionModalOpen(false); setVersionTitle(''); setVersionNote(''); setVersionFile(null); }}
        okText="Tao phien ban"
        okButtonProps={{ loading: versionUploading, disabled: !versionFile }}
        cancelText="Huy"
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Tieu de (tuy chon)</p>
            <input
              value={versionTitle}
              onChange={(e) => setVersionTitle(e.target.value)}
              placeholder="VD: Ban thiet ke v2 - cap nhat mesh"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
            />
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Ghi chu (tuy chon)</p>
            <textarea
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="Mo ta thay doi trong phien ban nay..."
              rows={3}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical' }}
            />
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#374151' }}>File 3D <span style={{ color: '#dc2626' }}>*</span></p>
            <input
              type="file"
              accept=".stl,.obj,.fbx,.gltf,.glb,.3mf,.step,.stp"
              onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
              style={{ fontSize: 13 }}
            />
            {versionFile && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
                {versionFile.name} ({(versionFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffCustomOrderDetail;
