import '@google/model-viewer';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Spin, message } from 'antd';
import {
  CloudUploadOutlined,
  FileOutlined,
  PictureOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { uploadPublicFile, extractUploadUrl } from '../../api/fileApi';
import { resolvePublicMediaUrl } from '../../utils/mediaUrl';
import { fileLabel } from '../../utils/variantMedia';
import '../../pages/Manager/ManageProducts.css';

/**
 * Upload zone — gán URL vào form qua onChange (không nhập link tay).
 */
const ProductFileUpload = ({
  label,
  hint,
  accept,
  allowedLabel,
  value,
  fileName: fileNameProp,
  onChange,
  previewType = 'image',
  required = false,
  className = '',
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localName, setLocalName] = useState(fileNameProp || '');

  useEffect(() => {
    if (fileNameProp) setLocalName(fileNameProp);
    else if (value) setLocalName(fileLabel(value));
    else setLocalName('');
  }, [value, fileNameProp]);

  const displayUrl = value ? resolvePublicMediaUrl(value) : null;
  const isGlb = (localName || value || '').toLowerCase().includes('.glb');

  const handleFile = async (file) => {
    if (!file) return;
    const ext = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
    const allowed = accept
      .split(',')
      .map((a) => {
        const t = a.trim().toLowerCase();
        return t.startsWith('.') ? t : `.${t}`;
      })
      .filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(ext)) {
      message.error(`Chỉ chấp nhận: ${allowedLabel || accept}`);
      return;
    }

    setUploading(true);
    try {
      const res = await uploadPublicFile(file);
      const url = extractUploadUrl(res);
      if (!url) throw new Error('Server không trả về URL file.');
      setLocalName(file.name);
      onChange?.(url, file.name);
      message.success('Tải file thành công');
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || err?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => {
    setLocalName('');
    onChange?.(null, '');
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasFile = Boolean(value);

  const showImagePreview = hasFile && previewType === 'image' && displayUrl;
  const showModelPreview = hasFile && previewType === 'model' && displayUrl && isGlb;

  return (
    <div className={`product-upload ${className}`}>
      {label && (
        <div className="product-upload__label">
          {label}
          {required && <span className="product-upload__required">*</span>}
        </div>
      )}
      {hint && <p className="product-upload__hint">{hint}</p>}

      <div
        className={`product-upload__zone ${hasFile ? 'product-upload__zone--done' : ''} ${uploading ? 'product-upload__zone--busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('product-upload__zone--hover');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('product-upload__zone--hover');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('product-upload__zone--hover');
          if (!uploading) handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !uploading && !hasFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="product-upload__input"
          tabIndex={-1}
          aria-hidden
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploading ? (
          <div className="product-upload__center">
            <Spin />
            <span className="product-upload__status">Đang tải lên...</span>
          </div>
        ) : hasFile ? (
          <div className="product-upload__done">
            <CheckCircleOutlined className="product-upload__check" />
            <div className="product-upload__file-meta">
              <span className="product-upload__file-name">{localName || fileLabel(value)}</span>
              <span className="product-upload__file-sub">Đã tải lên · {allowedLabel || accept}</span>
            </div>
            <div className="product-upload__actions">
              <Button type="link" size="small" onClick={() => inputRef.current?.click()}>
                Đổi file
              </Button>
              <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={clear} />
            </div>
          </div>
        ) : (
          <div className="product-upload__center">
            <CloudUploadOutlined className="product-upload__icon" />
            <span className="product-upload__prompt">Kéo thả hoặc bấm để chọn file</span>
            <span className="product-upload__formats">
              {allowedLabel || accept}
            </span>
          </div>
        )}
      </div>

      {showImagePreview && (
        <div className="product-upload__preview">
          <img src={displayUrl} alt="" />
        </div>
      )}

      {showModelPreview && (
        <div className="product-upload__model-preview">
          {/* eslint-disable-next-line react/no-unknown-property */}
          <model-viewer
            src={displayUrl}
            camera-controls
            auto-rotate
            shadow-intensity="0.4"
            style={{ width: '100%', height: '180px', background: '#f1f5f9' }}
          />
        </div>
      )}

      {hasFile && previewType === 'model' && displayUrl && !isGlb && (
        <div className="product-upload__file-badge">
          <FileOutlined /> STL/OBJ — xem trên cửa hàng sau khi có biến thể
        </div>
      )}
    </div>
  );
};

export default ProductFileUpload;
