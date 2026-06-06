import React, { useState } from 'react';
import { Button, Tag, Input, Modal } from 'antd';

const formatVnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0);

/**
 * Card hiển thị thông tin TechnicalDraft (báo giá kỹ thuật) trong chat.
 *
 * @param {object}   draft         — TechnicalDraftDTO (camelCase)
 * @param {boolean}  showApprove   — true = hiện nút "Duyệt" + "Không duyệt"
 * @param {function} onApprove     — (draftId) => void
 * @param {function} onReject      — (draftId, reason) => void — yêu cầu hiệu chỉnh
 * @param {boolean}  loading       — loading state for buttons
 * @param {string}   senderName    — tên nhân viên gửi
 * @param {string}   createdAt     — thời gian tạo
 */
export default function TechnicalDraftCard({
  draft,
  showApprove = false,
  onApprove,
  onReject,
  loading = false,
  senderName,
  createdAt,
}) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  if (!draft) return null;

  const d = {
    id: draft.id || draft.Id,
    materialName: draft.materialName || draft.MaterialName || '—',
    baseCost: Number(draft.materialBaseCostPerGram || draft.MaterialBaseCostPerGram || 0),
    serviceCost: Number(draft.materialTotalServiceCostPerGram || draft.MaterialTotalServiceCostPerGram || 0),
    weight: Number(draft.estimatedWeightPerUnit || draft.EstimatedWeightPerUnit || 0),
    infill: Number(draft.infillDensity || draft.InfillDensity || 0),
    layerHeight: Number(draft.layerHeight || draft.LayerHeight || 0),
    unitPrice: Number(draft.unitPrice || draft.UnitPrice || 0),
    markup: Number(draft.markupPercentage || draft.MarkupPercentage || 0),
    finalPrice: Number(draft.finalPrice || draft.FinalPrice || 0),
    note: draft.technicalNote || draft.TechnicalNote || '',
    confirmed: draft.isConfirmed || draft.IsConfirmed || false,
    version: draft.versionNumber || draft.VersionNumber,
    printTime: Number(draft.estimatedPrintTimePerUnit || draft.EstimatedPrintTimePerUnit || 0),
  };

  const rows = [
    { label: 'Vật liệu', value: d.materialName },
    { label: 'Giá vật liệu cơ bản', value: `${d.baseCost.toLocaleString('vi-VN')} đ/g` },
    { label: 'Giá dịch vụ chất liệu', value: `${d.serviceCost.toLocaleString('vi-VN')} đ/g` },
    { label: 'Khối lượng / sản phẩm', value: `${d.weight} g` },
    { label: 'Mật độ in (infill)', value: `${d.infill}%` },
    { label: 'Độ dày lớp in', value: `${d.layerHeight} mm` },
  ];

  if (d.printTime > 0) {
    rows.push({ label: 'Thời gian in ước tính', value: `${d.printTime} phút` });
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await onReject?.(d.id, rejectReason.trim());
      setRejectModalOpen(false);
      setRejectReason('');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 480, marginBottom: 8 }}>
      <div
        style={{
          border: '1.5px solid #c7d2fe',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3730a3' }}>
            Báo giá kỹ thuật {d.version ? `(v${d.version})` : ''}
          </span>
          {d.confirmed && (
            <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>Đã duyệt</Tag>
          )}
        </div>

        {/* Price highlight */}
        <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#065f46' }}>
            {formatVnd(d.finalPrice)}
          </span>
          {d.markup > 0 && (
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              (đơn giá {formatVnd(d.unitPrice)} + markup {d.markup}%)
            </span>
          )}
        </div>

        {/* Specs table */}
        <div style={{ padding: '10px 14px' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e0e7ff' }}>
                  <td style={{ padding: '5px 0', color: '#6b7280', width: '55%' }}>{r.label}</td>
                  <td style={{ padding: '5px 0', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Note */}
        {d.note && (
          <div style={{ padding: '0 14px 10px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#4b5563', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
              {d.note}
            </p>
          </div>
        )}

        {/* Approve / Reject buttons or confirmed badge */}
        <div style={{ padding: '0 14px 12px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {d.confirmed ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
              ✓ Báo giá đã được duyệt
            </span>
          ) : showApprove ? (
            <>
              {onReject && (
                <Button
                  size="small"
                  danger
                  loading={loading}
                  onClick={() => setRejectModalOpen(true)}
                  style={{ fontWeight: 600 }}
                >
                  Không duyệt
                </Button>
              )}
              {onApprove && (
                <Button
                  type="primary"
                  size="small"
                  loading={loading}
                  onClick={() => onApprove(d.id)}
                  style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}
                >
                  Duyệt báo giá
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Sender + time */}
      {(senderName || createdAt) && (
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
          {createdAt && new Date(createdAt).toLocaleString('vi-VN')}
          {senderName && ` · ${senderName}`}
        </div>
      )}

      {/* Reject reason modal */}
      <Modal
        title="Không duyệt báo giá"
        open={rejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(''); }}
        okText="Gửi yêu cầu hiệu chỉnh"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim(), loading: rejecting }}
        cancelText="Hủy"
        destroyOnClose
      >
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151' }}>
          Vui lòng mô tả lý do không duyệt hoặc nội dung cần hiệu chỉnh. Nhân viên sẽ xem xét và gửi lại báo giá mới.
        </p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="VD: Giá quá cao, muốn dùng vật liệu khác, cần giảm infill..."
        />
      </Modal>
    </div>
  );
}
