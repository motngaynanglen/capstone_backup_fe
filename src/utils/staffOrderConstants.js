/** Hằng số trạng thái đồng bộ với BE — dùng cho module Staff. */

export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Chờ xác nhận', color: 'default' },
  { value: 'PROCESSING', label: 'Đang xử lý / sản xuất', color: 'processing' },
  { value: 'FINISHED', label: 'Sẵn sàng giao', color: 'cyan' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'success' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'error' },
];

export const SHIPMENT_STATUSES = [
  { value: 'PREPARING', label: 'Đang đóng gói', color: 'gold' },
  { value: 'READY_FOR_PICKUP', label: 'Chờ lấy hàng', color: 'orange' },
  { value: 'IN_TRANSIT', label: 'Đang giao', color: 'blue' },
  { value: 'DELIVERED', label: 'Giao thành công', color: 'green' },
];

export const FULFILLMENT_STATUSES = [
  { value: 'PENDING', label: 'Chờ xử lý', color: 'default' },
  { value: 'DESIGNING', label: 'Đang thiết kế', color: 'purple' },
  { value: 'PRINTING', label: 'Đang in 3D', color: 'processing' },
  { value: 'PICKING', label: 'Đang soạn hàng', color: 'gold' },
  { value: 'FINISHED', label: 'Hoàn thiện', color: 'success' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'error' },
];

export const CUSTOM_SOURCE_TYPES = new Set([
  'CUSTOM_QUOTE_MF2',
  'CUSTOM_FILE_PRINT_MF2',
  'AI_GENERATED',
  'PRE_ORDER',
]);

export const orderStatusMap = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s]));
export const shipmentStatusMap = Object.fromEntries(SHIPMENT_STATUSES.map((s) => [s.value, s]));
export const fulfillmentStatusMap = Object.fromEntries(FULFILLMENT_STATUSES.map((s) => [s.value, s]));

export function pickApi(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

export function normStatus(s) {
  return (s || '').toUpperCase();
}

export function isCustomManufacturing(sourceType) {
  return CUSTOM_SOURCE_TYPES.has(normStatus(sourceType));
}

export function isInStockItem(sourceType) {
  const st = normStatus(sourceType);
  return st === 'IN_STOCK' || st === 'ORDER';
}

/** Tất cả dòng hàng (trừ CANCELLED) đã FINISHED — sẵn sàng chuyển đơn sang giao hàng. */
export function allOrderItemsReadyForShip(items) {
  if (!Array.isArray(items) || items.length === 0) return true;
  const active = items.filter((it) => normStatus(it.fulfillmentStatus) !== 'CANCELLED');
  if (active.length === 0) return true;
  return active.every((it) => normStatus(it.fulfillmentStatus) === 'FINISHED');
}

export function isTerminalOrderStatus(orderStatus) {
  const os = normStatus(orderStatus);
  return os === 'COMPLETED' || os === 'CANCELLED';
}

/** Bước tiếp theo staff có thể thực hiện trên đơn (không gồm vận chuyển — xử lý ở StaffCarrierActions). */
export function getStaffOrderStatusActions({
  orderStatus,
  canFulfill,
  allItemsReady,
}) {
  const os = normStatus(orderStatus);

  if (isTerminalOrderStatus(os)) {
    return [];
  }

  if (os === 'PENDING' && canFulfill) {
    return [
      {
        key: 'accept',
        orderStatus: 'PROCESSING',
        shipmentStatus: 'PREPARING',
        label: 'Tiếp nhận đơn',
        description: 'Chuyển sang đang xử lý / sản xuất',
      },
    ];
  }

  if (os === 'PROCESSING' && canFulfill && allItemsReady) {
    return [
      {
        key: 'ready-for-ship',
        orderStatus: 'FINISHED',
        shipmentStatus: 'READY_FOR_PICKUP',
        label: 'Sẵn sàng giao',
        description: 'Hoàn tất sản xuất, chờ tạo vận đơn GHN',
        primary: true,
        confirm: 'Xác nhận chuyển sang sẵn sàng giao?',
      },
    ];
  }

  return [];
}

/** Bước vận chuyển tiếp theo (GHN) — chỉ khi đơn chưa kết thúc. */
export function getStaffShipmentStatusActions({ orderStatus, shipmentStatus, hasCarrier }) {
  const os = normStatus(orderStatus);
  const ss = normStatus(shipmentStatus);

  if (isTerminalOrderStatus(os)) {
    return [];
  }

  if (hasCarrier && ss === 'READY_FOR_PICKUP') {
    return [
      {
        key: 'in-transit',
        orderStatus: os,
        shipmentStatus: 'IN_TRANSIT',
        label: 'Bàn giao cho ship',
        description: 'Xác nhận đơn đã được bàn giao cho đơn vị vận chuyển',
      },
    ];
  }

  if (ss === 'IN_TRANSIT') {
    return [
      {
        key: 'delivered',
        orderStatus: 'COMPLETED',
        shipmentStatus: 'DELIVERED',
        label: 'Giao thành công',
        description: 'Xác nhận khách đã nhận hàng',
        primary: true,
        confirm: 'Xác nhận khách đã nhận hàng?',
      },
    ];
  }

  return [];
}

/** Chuẩn hóa ProductionQueueOrderDto từ BE. */
export function normalizeProductionQueueOrder(row) {
  if (!row) return null;
  const lines = (pickApi(row, 'lines', 'Lines') || []).map((l) => ({
    orderItemId: pickApi(l, 'orderItemId', 'OrderItemId'),
    itemName: pickApi(l, 'itemName', 'ItemName') || 'Sản phẩm',
    sourceType: pickApi(l, 'sourceType', 'SourceType'),
    fulfillmentStatus: normStatus(pickApi(l, 'fulfillmentStatus', 'FulfillmentStatus')),
    quantityOrdered: pickApi(l, 'quantityOrdered', 'QuantityOrdered') ?? 1,
    designWorkId: pickApi(l, 'designWorkId', 'DesignWorkId'),
  }));

  return {
    orderId: pickApi(row, 'orderId', 'OrderId'),
    orderCode: pickApi(row, 'orderCode', 'OrderCode') || '—',
    customerName: pickApi(row, 'customerName', 'CustomerName') || '—',
    orderStatus: normStatus(pickApi(row, 'orderStatus', 'OrderStatus')),
    shipmentStatus: normStatus(pickApi(row, 'shipmentStatus', 'ShipmentStatus')),
    paymentStatus: normStatus(pickApi(row, 'paymentStatus', 'PaymentStatus')),
    created: pickApi(row, 'created', 'Created'),
    totalPrice: pickApi(row, 'totalPrice', 'TotalPrice') ?? 0,
    lines,
    allLinesFinished: Boolean(pickApi(row, 'allLinesFinished', 'AllLinesFinished')),
    pendingPrintCount: pickApi(row, 'pendingPrintCount', 'PendingPrintCount') ?? 0,
  };
}
