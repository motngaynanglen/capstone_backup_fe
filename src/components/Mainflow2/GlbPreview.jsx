import React from 'react';
import '@google/model-viewer';
import { resolvePublicMediaUrl } from '../../utils/mediaUrl';

/**
 * Inline GLB/GLTF preview via @google/model-viewer.
 */
export default function GlbPreview({ src, height = 240, style = {} }) {
  if (!src) return null;

  const resolvedSrc = resolvePublicMediaUrl(src);

  return (
    <div
      style={{
        height,
        borderRadius: 10,
        overflow: 'hidden',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        ...style,
      }}
    >
      <model-viewer
        src={resolvedSrc}
        camera-controls
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
