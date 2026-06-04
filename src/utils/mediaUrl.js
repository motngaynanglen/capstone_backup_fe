/** Ghép URL tĩnh /uploads với API base (sửa link localhost lưu từ môi trường dev). */
export function resolvePublicMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!apiBase) return url;

  const trimmed = url.trim();

  if (trimmed.startsWith('/uploads/')) {
    return `${apiBase}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const isLocalHost =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (isLocalHost && parsed.pathname.startsWith('/uploads/')) {
      return `${apiBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // không phải absolute URL
  }

  return url;
}
