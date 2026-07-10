import React from 'react';
import '@google/model-viewer';
import { resolvePublicMediaUrl } from '../../utils/mediaUrl';

const GLB_VIEWER_BG = '#0f172a';

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
        background: GLB_VIEWER_BG,
        border: '1px solid #334155',
        ...style,
      }}
    >
      <model-viewer
        src={resolvedSrc}
        camera-controls
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1.2"
        interaction-prompt="none"
        style={{ width: '100%', height: '100%', backgroundColor: GLB_VIEWER_BG }}
      />
    </div>
  );
}
