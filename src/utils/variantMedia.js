import { resolvePublicMediaUrl } from './mediaUrl';

/** Media gốc trên mẫu thiết kế (file 3D + thumbnail). */
export function getTemplateMedia(template) {
  if (!template) return { thumbnail: null, fileUrl: null };
  return {
    thumbnail: template.thumbnailUrl ? resolvePublicMediaUrl(template.thumbnailUrl) : null,
    fileUrl: template.fileUrl ? resolvePublicMediaUrl(template.fileUrl) : null,
  };
}

/** Cách biến thể hiển thị trên cửa hàng — override hoặc kế thừa mẫu. */
export function getVariantMediaDisplay(variant, template) {
  const tpl = getTemplateMedia(template);
  const hasOverride = Boolean(variant?.previewModelUrl?.trim());
  const model = hasOverride
    ? resolvePublicMediaUrl(variant.previewModelUrl)
    : resolvePublicMediaUrl(
        variant?.effectivePreviewModelUrl || variant?.designTemplateFileUrl || template?.fileUrl
      ) || tpl.fileUrl;
  const thumb =
    resolvePublicMediaUrl(variant?.effectiveThumbnailUrl || template?.thumbnailUrl) ||
    tpl.thumbnail;
  return {
    model,
    thumb,
    hasOverride,
    source: hasOverride ? 'variant' : 'template',
  };
}

export function fileLabel(url) {
  if (!url) return 'Chưa có file';
  try {
    const path = new URL(url, 'http://local').pathname;
    return path.split('/').pop() || url;
  } catch {
    return url.length > 40 ? `${url.slice(0, 38)}…` : url;
  }
}
