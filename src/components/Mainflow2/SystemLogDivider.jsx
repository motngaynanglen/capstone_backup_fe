import React from 'react';

/**
 * Hiển thị log hệ thống/tự động (LogType = SYSTEM, STATUS_CHANGE) dưới dạng
 * đường gạch ngang ở giữa kèm thông báo — thay vì bong bóng chat.
 *
 *   ──────────  [nội dung thông báo · thời gian]  ──────────
 *
 * @param {string} content  Nội dung thông báo
 * @param {string} created  Thời điểm (ISO) — hiển thị nhỏ kèm theo
 */
export default function SystemLogDivider({ content, created }) {
  const text = (content || '').trim();
  if (!text) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      <span
        style={{
          flexShrink: 1,
          maxWidth: '78%',
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 1.4,
          color: '#9ca3af',
          fontStyle: 'italic',
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
        {created ? ` · ${new Date(created).toLocaleString('vi-VN')}` : ''}
      </span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
  );
}
