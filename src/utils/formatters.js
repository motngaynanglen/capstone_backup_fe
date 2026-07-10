export function formatVnd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('vi-VN')} ₫`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function shortId(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length > 8 ? `${s.slice(0, 8)}…` : s;
}
