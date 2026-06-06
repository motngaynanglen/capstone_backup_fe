import React from 'react';
import { Button } from 'antd';

const STATUS_CONFIG = {
  PENDING_REVIEW: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Cho duyet' },
  APPROVED: { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', label: 'Da duyet' },
  REJECTED: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Tu choi' },
};

/**
 * Renders an ADJUSTMENT_REQUEST log entry in chat.
 *
 * @param {object}   msg        — normalized design log
 * @param {boolean}  isStaff    — true = show review buttons, false = view-only
 * @param {function} onApprove  — (logId) => void — staff approves
 * @param {function} onReject   — (logId) => void — staff opens reject modal
 * @param {boolean}  processing — loading state
 */
export default function AdjustmentRequestCard({ msg, isStaff, onApprove, onReject, processing }) {
  const status = msg.adjustmentRequestStatus || 'PENDING_REVIEW';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_REVIEW;
  const isPending = status === 'PENDING_REVIEW';
  const images = msg.imageUrls || [];

  return (
    <div style={{ width: '100%', marginBottom: 8 }}>
      <div
        style={{
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 12,
          background: cfg.bg,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px 14px',
            borderBottom: `1px solid ${cfg.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>&#9998;</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, flex: 1 }}>
            Yeu cau hieu chinh
          </span>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 600,
              background: status === 'PENDING_REVIEW' ? '#fff7ed' : cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '10px 14px' }}>
          {/* Sender + time */}
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>{msg.senderName || 'Nguoi gui'}</span>
            {' · '}
            {new Date(msg.created).toLocaleString('vi-VN')}
          </div>

          {/* Content */}
          {msg.content && (
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#1f2937', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </p>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {images.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Ref ${idx + 1}`}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                </a>
              ))}
            </div>
          )}

          {/* Decision note (after review) */}
          {!isPending && msg.adjustmentDecisionNote && (
            <div
              style={{
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                fontSize: 12,
                color: status === 'APPROVED' ? '#065f46' : '#991b1b',
              }}
            >
              <span style={{ fontWeight: 700 }}>Phan hoi: </span>
              {msg.adjustmentDecisionNote}
              {msg.adjustmentReviewedAt && (
                <span style={{ display: 'block', marginTop: 2, fontSize: 10, color: '#6b7280' }}>
                  {new Date(msg.adjustmentReviewedAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          )}

          {/* Staff review buttons */}
          {isPending && isStaff && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button
                type="primary"
                size="small"
                loading={processing}
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}
                onClick={() => onApprove?.(msg.id)}
              >
                Dong y
              </Button>
              <Button
                danger
                size="small"
                loading={processing}
                onClick={() => onReject?.(msg.id)}
              >
                Tu choi
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
