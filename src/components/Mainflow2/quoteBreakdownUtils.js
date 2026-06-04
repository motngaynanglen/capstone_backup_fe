const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0);

export function pickQuotedPrice(meta) {
  if (!meta || typeof meta !== "object") return null;
  return meta.quotedPrice ?? meta.QuotedPrice ?? null;
}

export function formatQuotePrice(meta) {
  const p = pickQuotedPrice(meta);
  return p == null ? "—" : formatVnd(p);
}

export { formatVnd };
