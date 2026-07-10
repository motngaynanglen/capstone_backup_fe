import React from 'react';
import { Button, Input } from 'antd';
import { PaperClipOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Model3DPreview from './Model3DPreview';
import { parseMessageMetadata } from './messageMetadataUtils';

/**
 * Renders a chat bubble with text and optional 3D/image attachments.
 */
export default function ChatMessageBubble({ msg, isMe, otherLabel = 'Nhân viên' }) {
  const { attachments } = parseMessageMetadata(msg.metadataJson);
  const hasContent = Boolean(msg.content?.trim());
  const isFilePlaceholder = /^\[File: .+\]$/.test(msg.content?.trim() || '');
  const showContent = hasContent && !(isFilePlaceholder && attachments.length > 0);
  const hasAttachments = attachments.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          padding: hasAttachments && !showContent ? '6px' : '8px 14px',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          maxWidth: hasAttachments ? '85%' : '70%',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          background: isMe ? '#4f46e5' : '#fff',
          color: isMe ? '#fff' : '#1f2937',
          border: isMe ? 'none' : '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {showContent && <div style={{ marginBottom: hasAttachments ? 8 : 0 }}>{msg.content}</div>}
        {hasAttachments && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.map((url, idx) => (
              <Model3DPreview key={`${url}-${idx}`} fileUrl={url} height={200} />
            ))}
          </div>
        )}
      </div>
      <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
        {new Date(msg.created).toLocaleString('vi-VN')} · {isMe ? 'Tôi' : otherLabel}
      </span>
    </div>
  );
}

/**
 * Chat input with optional file attachment (GLB, STL, OBJ, images).
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)',
  extraLeft,
  uploading,
}) {
  const fileInputRef = React.useRef(null);
  const [pendingFile, setPendingFile] = React.useState(null);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  const handleSend = () => {
    onSend?.({ content: value, file: pendingFile });
    setPendingFile(null);
  };

  const canSend = !disabled && !uploading && (value?.trim() || pendingFile);

  return (
    <>
      {pendingFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: '#f0f4ff',
            borderTop: '1px solid #e0e7ff',
            fontSize: 12,
            color: '#3730a3',
          }}
        >
          <PaperClipOutlined />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pendingFile.name}
          </span>
          <Button type="text" size="small" icon={<CloseCircleOutlined />} onClick={() => setPendingFile(null)} />
        </div>
      )}
      <div
        style={{
          flexShrink: 0,
          background: '#fff',
          borderTop: pendingFile ? 'none' : '1px solid #e5e7eb',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        {extraLeft}
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.stl,.obj,image/*"
          style={{ display: 'none' }}
          onChange={handleFilePick}
        />
        <Button
          type="text"
          icon={<PaperClipOutlined />}
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          title="Đính kèm file 3D hoặc ảnh"
        />
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: 12,
            fontSize: 14,
            color: '#111827',
          }}
        />
        <Button
          type="primary"
          loading={uploading}
          onClick={() => canSend && handleSend()}
          style={{
            flexShrink: 0,
            height: 36,
            borderRadius: 12,
            fontWeight: 600,
            background: canSend ? '#4f46e5' : '#eef2ff',
            borderColor: canSend ? '#4f46e5' : '#a5b4fc',
            color: canSend ? '#ffffff' : '#4338ca',
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: 1,
          }}
        >
          Gửi →
        </Button>
      </div>
    </>
  );
}
