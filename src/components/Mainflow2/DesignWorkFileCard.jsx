import React from 'react';
import Model3DPreview from './Model3DPreview';

/**
 * Thumbnail / preview file cũ trên danh sách in từ thiết kế & in lại đơn.
 */
export default function DesignWorkFileCard({ fileUrl, label = 'File cũ', height = 140 }) {
  if (!fileUrl) {
    return (
      <div
        className="shrink-0 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400"
        style={{ width: 180, height }}
      >
        Không có file
      </div>
    );
  }

  return (
    <div className="shrink-0 w-[180px]">
      <p className="text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{label}</p>
      <div className="rounded-xl overflow-hidden border border-gray-100 bg-slate-900">
        <Model3DPreview fileUrl={fileUrl} height={height} />
      </div>
    </div>
  );
}
