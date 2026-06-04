import React from 'react';
import GlbPreview from './GlbPreview';
import { getModel3dKind, isImageUrl } from '../../utils/model3d';

/**
 * Preview 3D model or image attachment inline in chat.
 */
export default function Model3DPreview({ fileUrl, height = 220 }) {
  if (!fileUrl) return null;

  const kind = getModel3dKind(fileUrl);

  if (kind === 'gltf') {
    return <GlbPreview src={fileUrl} height={height} />;
  }

  if (isImageUrl(fileUrl)) {
    return (
      <img
        src={fileUrl}
        alt="Đính kèm"
        style={{
          maxWidth: '100%',
          maxHeight: height,
          borderRadius: 8,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  const label = kind === 'stl' ? 'STL' : kind === 'obj' ? 'OBJ' : 'File 3D';
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: '#f0f4ff',
        borderRadius: 8,
        border: '1px solid #e0e7ff',
        textDecoration: 'none',
        color: '#3730a3',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: 18 }}>📦</span>
      Tải {label}
    </a>
  );
}
