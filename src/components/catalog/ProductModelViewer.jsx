import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { Spin } from 'antd';
import { resolvePublicMediaUrl } from '../../utils/mediaUrl';
import { pickFallbackGlb } from '../../utils/catalogProduct';

/**
 * GLB viewer dùng chung — layout absolute fill, fallback khi URL lỗi.
 */
const ProductModelViewer = ({
  src,
  fallbackId,
  poster,
  className = '',
  style = {},
  cameraControls = true,
  autoRotate = true,
  interactionPrompt = 'none',
  showLoading = true,
}) => {
  const viewerRef = useRef(null);
  const [activeSrc, setActiveSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const primary = src ? resolvePublicMediaUrl(src) : '';
    setFailed(false);
    setLoading(Boolean(primary));
    setActiveSrc(primary || pickFallbackGlb(fallbackId));
  }, [src, fallbackId]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !activeSrc) return undefined;

    const onLoad = () => setLoading(false);
    const onError = () => {
      const fallback = pickFallbackGlb(fallbackId);
      if (activeSrc !== fallback) {
        setFailed(true);
        setActiveSrc(fallback);
        setLoading(true);
        return;
      }
      setLoading(false);
    };

    el.src = activeSrc;
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, [activeSrc, fallbackId]);

  const resolvedPoster = poster ? resolvePublicMediaUrl(poster) : undefined;

  return (
    <div className={`relative ${className}`} style={style}>
      <model-viewer
        ref={viewerRef}
        camera-controls={cameraControls || undefined}
        auto-rotate={autoRotate || undefined}
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1.2"
        interaction-prompt={interactionPrompt}
        crossorigin="anonymous"
        poster={resolvedPoster}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 240,
          backgroundColor: '#f8fafc',
        }}
      />
      {showLoading && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 pointer-events-none">
          <Spin tip="Đang tải mô hình 3D..." />
        </div>
      )}
      {failed && !loading && (
        <div className="absolute bottom-2 left-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 pointer-events-none">
          Đang dùng mô hình mẫu
        </div>
      )}
    </div>
  );
};

export default ProductModelViewer;
