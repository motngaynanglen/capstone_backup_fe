import { isCustomPrintSourceType } from '../api/mainflow2Api';

export function resolveDesignWorkIdFromOrder(order) {
  const items = order?.items || order?.orderItems || order?.OrderItems || [];
  const match = items.find((it) => {
    const designWorkId = it.designWorkId ?? it.DesignWorkId;
    const sourceType = it.sourceType ?? it.SourceType;
    return designWorkId && isCustomPrintSourceType(sourceType);
  });
  return match?.designWorkId ?? match?.DesignWorkId ?? null;
}

export function resolveMainflow2ChatPath(orderOrDesignWorkId) {
  if (!orderOrDesignWorkId) return null;
  if (typeof orderOrDesignWorkId === 'string') {
    return `/custom-orders/${orderOrDesignWorkId}`;
  }
  const designWorkId = resolveDesignWorkIdFromOrder(orderOrDesignWorkId);
  return designWorkId ? `/custom-orders/${designWorkId}` : null;
}
