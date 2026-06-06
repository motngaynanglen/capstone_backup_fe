import React, { useState } from 'react';
import { Button, Input, Modal } from 'antd';
import Model3DPreview from './Model3DPreview';
import TechnicalDraftCard from './TechnicalDraftCard';

/**
 * Card hiển thị đầy đủ một log VERSION_UPDATE (nhân viên tải lên phiên bản
 * thiết kế 3D mới) trong khung chat — dùng chung cho cả trang staff & khách.
 *
 * Hiển thị:
 *  - Nội dung chat (msg.content)
 *  - Khung xem 3D cho từng version đính kèm
 *  - Nút "Xem" → mở file 3D ở tab/trang khác
 *  - Báo giá kỹ thuật (nếu version đã có TechnicalDraft) — nhúng TechnicalDraftCard
 *  - role="staff": nút "Tạo bản báo giá" cho version chưa có báo giá (design service)
 *  - role="customer": nút "Duyệt báo giá" trên báo giá kèm theo (design service)
 *
 * Lưu ý nghiệp vụ:
 *  - Trong design service, nhân viên KHÔNG duyệt thiết kế (đó là việc của khách).
 *    Vì vậy card này không render nút duyệt/từ chối file cho staff.
 *  - Khách "duyệt thiết kế" = duyệt báo giá kỹ thuật (confirmTechnicalDraft) → COMPLETED.
 *
 * @param {object}   msg              DesignLog (logType=VERSION_UPDATE), có .versions[]
 * @param {boolean}  isMe             true = căn phải (người đang xem là tác giả)
 * @param {'staff'|'customer'} role
 * @param {Array}    drafts           Danh sách TechnicalDraft của design work
 * @param {boolean}  isPrintService   true = đơn in theo yêu cầu (không có báo giá tự tạo)
 * @param {string}   designWorkStatus SKETCHING|PENDING|IN_PROGRESS|REVIEWING|COMPLETED
 * @param {boolean}  isLocked
 * @param {boolean}  processing
 * @param {function} onCreateQuote    (versionId) => void   (staff)
 * @param {function} onApproveDraft   (draftId) => void     (customer)
 * @param {function} onRejectDraft    (draftId, reason) => void (customer)
 * @param {function} onOpenFile       (fileUrl) => void
 */
export default function VersionUpdateCard({
  msg,
  isMe = false,
  role = 'staff',
  drafts = [],
  isPrintService = false,
  designWorkStatus,
  isLocked = false,
  processing = false,
  onCreateQuote,
  onApproveDraft,
  onRejectDraft,
  onReviewFile,
  onOpenFile,
}) {
  const versions = msg?.versions || msg?.Versions || [];
  const content = msg?.content?.trim();
  const canQuoteStatus = ['IN_PROGRESS', 'REVIEWING'].includes(designWorkStatus);

  // Modal xem 3D tại chỗ
  const [viewerUrl, setViewerUrl] = useState(null);

  // "Tải file 3D": mở URL trực tiếp — trình duyệt sẽ tải file .glb/.stl về.
  const downloadFile = (url) => {
    if (!url) return;
    if (onOpenFile) onOpenFile(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

  const findDraft = (versionId) =>
    drafts.find((d) => (d.designVersionHistoryId || d.DesignVersionHistoryId) === versionId);

  const reviewBadge = (status) => {
    if (status === 'ACCEPTED') return { text: 'Đã duyệt thiết kế', bg: '#ecfdf5', color: '#059669' };
    if (status === 'REJECTED') return { text: 'Đã từ chối', bg: '#fef2f2', color: '#dc2626' };
    return { text: isPrintService ? 'Chờ duyệt file' : 'Chờ khách duyệt', bg: '#fffbeb', color: '#d97706' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          border: '1.5px solid #bfdbfe',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
            📐 Phiên bản thiết kế mới
          </span>
        </div>

        {/* Chat content */}
        {content && (
          <div style={{ padding: '10px 14px 0', fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {content}
          </div>
        )}

        {/* Versions */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {versions.length === 0 && (
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Không có file 3D đính kèm.</p>
          )}
          {versions.map((v, i) => {
            const vId = v.id || v.Id;
            const vUrl = v.fileUrl || v.FileUrl || v.url || v.Url;
            const vNum = v.versionNumber || v.VersionNumber;
            const vReview = v.fileReviewStatus || v.FileReviewStatus
              || ((v.isApproved || v.IsApproved) ? 'ACCEPTED' : null);
            const vDraft = findDraft(vId);
            const draftConfirmed = vDraft?.isConfirmed || vDraft?.IsConfirmed;
            const badge = reviewBadge(vReview);

            const staffCanQuote = role === 'staff' && !isPrintService && !vDraft && !isLocked && canQuoteStatus;
            const customerCanApprove = role === 'customer' && vDraft && !draftConfirmed && !isLocked && canQuoteStatus;
            const canReviewFile = onReviewFile && !isLocked && !vReview;

            return (
              <div key={vId || i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', flex: 1 }}>
                    {v.title || v.Title || `Phiên bản v${vNum ?? i + 1}`}
                  </span>
                  <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color }}>
                    {badge.text}
                  </span>
                </div>

                {vUrl && <Model3DPreview fileUrl={vUrl} height={200} />}

                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {vUrl && (
                    <>
                      <Button size="small" type="primary" onClick={() => setViewerUrl(vUrl)}>
                        👁 Xem file 3D
                      </Button>
                      <Button size="small" onClick={() => downloadFile(vUrl)}>
                        ⬇ Tải file 3D
                      </Button>
                    </>
                  )}
                  {staffCanQuote && (
                    <Button
                      size="small"
                      type="primary"
                      loading={processing}
                      onClick={() => onCreateQuote?.(vId)}
                      style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}
                    >
                      💰 Tạo bản báo giá
                    </Button>
                  )}
                  {canReviewFile && (
                    <>
                      <Button
                        size="small"
                        type="primary"
                        loading={processing}
                        onClick={() => onReviewFile(vId, 'ACCEPTED')}
                        style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}
                      >
                        ✅ Duyệt file
                      </Button>
                      <Button
                        size="small"
                        danger
                        loading={processing}
                        onClick={() => {
                          let reason = '';
                          Modal.confirm({
                            title: 'Từ chối file thiết kế',
                            content: (
                              <Input.TextArea
                                placeholder="Lý do từ chối..."
                                rows={3}
                                onChange={(e) => { reason = e.target.value; }}
                              />
                            ),
                            okText: 'Từ chối',
                            okButtonProps: { danger: true },
                            onOk: () => onReviewFile(vId, 'REJECTED', reason),
                          });
                        }}
                      >
                        ❌ Từ chối
                      </Button>
                    </>
                  )}
                </div>

                {/* Báo giá kỹ thuật gắn với version — chỉ hiện cho customer (staff thấy riêng trên chat) */}
                {role === 'customer' && vDraft && (
                  <div style={{ marginTop: 10 }}>
                    <TechnicalDraftCard
                      draft={vDraft}
                      showApprove={customerCanApprove}
                      onApprove={onApproveDraft}
                      onReject={onRejectDraft}
                      loading={processing}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sender + time */}
      <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
        {msg?.created && new Date(msg.created).toLocaleString('vi-VN')}
        {msg?.senderName ? ` · ${isMe ? 'Tôi' : msg.senderName}` : ''}
      </span>

      {/* Modal xem 3D tại chỗ */}
      <Modal
        open={!!viewerUrl}
        onCancel={() => setViewerUrl(null)}
        footer={null}
        width="90vw"
        style={{ top: 24, maxWidth: 1200 }}
        title="Xem file 3D"
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        {viewerUrl && (
          <div style={{ width: '100%', height: '78vh', background: '#0f172a' }}>
            <Model3DPreview fileUrl={viewerUrl} height="100%" />
          </div>
        )}
      </Modal>
    </div>
  );
}
