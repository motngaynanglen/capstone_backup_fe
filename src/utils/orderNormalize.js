const norm = (s) => (s || '').toUpperCase();

const CUSTOM_SOURCE_TYPES = new Set([
  'CUSTOM_QUOTE_MF2',
  'CUSTOM_FILE_PRINT_MF2',
  'AI_GENERATED',
  'PRE_ORDER',
]);

export function orderHasCustomManufacturing(items) {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some((it) => CUSTOM_SOURCE_TYPES.has(norm(it.sourceType)));
}

export function orderHasPreOrder(items) {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some((it) => norm(it.sourceType) === 'PRE_ORDER');
}

/**
 * Badge + timeline khách — đồng bộ OrderStatuses + ShipmentStatuses từ BE.
 */
export function resolveCustomerOrderDisplayStatus(orderStatus, shipmentStatus, isInvoicePaid, items) {
  const os = norm(orderStatus);
  const ss = norm(shipmentStatus);
  const customMfg = orderHasCustomManufacturing(items);

  if (os === 'CANCELLED') return { key: 'CANCELLED', label: 'Đã hủy' };
  if (os === 'COMPLETED') return { key: 'COMPLETED', label: 'Hoàn thành' };
  if (ss === 'DELIVERED') return { key: 'COMPLETED', label: 'Đã giao hàng' };
  if (ss === 'IN_TRANSIT') return { key: 'SHIPPING', label: 'Đang giao hàng' };

  if (customMfg) {
    if (os === 'FINISHED' || ss === 'READY_FOR_PICKUP') {
      return { key: 'READY_FOR_SHIP', label: 'Sẵn sàng giao (chờ GHN)' };
    }
    if (os === 'PROCESSING' || ss === 'PREPARING') {
      return { key: 'PRODUCTION', label: 'Đang sản xuất / in 3D' };
    }
  } else {
    if (os === 'FINISHED' || ss === 'READY_FOR_PICKUP') {
      return { key: 'FINISHED', label: 'Chờ giao hàng' };
    }
    if (os === 'PROCESSING' || ss === 'PREPARING') {
      return { key: 'PROCESSING', label: 'Đang chuẩn bị hàng' };
    }
  }

  if (os === 'PENDING' && isInvoicePaid) return { key: 'PAID', label: 'Đã thanh toán · chờ xử lý' };
  if (os === 'PENDING') return { key: 'PENDING', label: 'Chờ thanh toán' };
  return { key: os || 'PENDING', label: os || 'Chờ xử lý' };
}

/**
 * Timeline khách — tách rõ sản xuất vs giao hàng (flow 2/3 / pre-order).
 */
export function buildCustomerTrackingSteps(orderStatus, shipmentStatus, isInvoicePaid, items) {
  const os = norm(orderStatus);
  const ss = norm(shipmentStatus);

  if (os === 'FAILED' || os === 'CANCELLED') {
    return [{
      key: 'failed',
      label: os === 'CANCELLED' ? 'Đơn hàng đã hủy' : 'Đơn hàng thất bại',
      description: os === 'CANCELLED' ? 'Đơn hàng đã bị hủy.' : 'Thanh toán không thành công hoặc đơn bị huỷ.',
      done: true,
      isFailed: true,
    }];
  }

  const paid = Boolean(isInvoicePaid);
  const customMfg = orderHasCustomManufacturing(items);
  const preOrder = orderHasPreOrder(items);

  const productionComplete =
    ['FINISHED', 'COMPLETED'].includes(os) ||
    ['READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(ss);

  const inProduction = os === 'PROCESSING' && !productionComplete;

  const readyForShip =
    productionComplete &&
    !['IN_TRANSIT', 'DELIVERED'].includes(ss) &&
    os !== 'COMPLETED';

  const inTransit = ss === 'IN_TRANSIT';
  const delivered = ss === 'DELIVERED' || os === 'COMPLETED';

  const steps = [
    {
      key: 'placed',
      label: 'Đã đặt hàng',
      description: 'Đơn hàng đã được tiếp nhận.',
      done: true,
      isCurrent: false,
    },
    {
      key: 'paid',
      label: 'Đã thanh toán',
      description: 'Thanh toán đã được xác nhận — đưa vào hàng đợi sản xuất.',
      done: paid,
      isCurrent: !paid && os === 'PENDING',
    },
  ];

  if (customMfg || preOrder) {
    steps.push({
      key: 'production',
      label: preOrder && !customMfg ? 'Đang sản xuất (Pre-Order)' : 'Đang sản xuất / in 3D',
      description: 'Xưởng đang in và hoàn thiện sản phẩm theo đơn của bạn.',
      done: productionComplete,
      isCurrent: inProduction,
      isPreOrder: preOrder,
    });
    steps.push({
      key: 'ready_for_ship',
      label: 'Sẵn sàng giao',
      description: 'Sản phẩm đã xong — shop sẽ tạo vận đơn GHN.',
      done: ['IN_TRANSIT', 'DELIVERED'].includes(ss) || os === 'COMPLETED',
      isCurrent: readyForShip,
    });
  } else {
    steps.push({
      key: 'processing',
      label: 'Đang chuẩn bị / đóng gói',
      description: 'Shop đang soạn và đóng gói sản phẩm.',
      done: productionComplete,
      isCurrent: inProduction,
    });
  }

  steps.push(
    {
      key: 'shipping',
      label: 'Đang vận chuyển',
      description: 'Đơn đã bàn giao cho đơn vị vận chuyển.',
      done: delivered,
      isCurrent: inTransit,
    },
    {
      key: 'completed',
      label: 'Đã giao hàng',
      description: 'Khách đã nhận hàng thành công.',
      done: delivered,
      isCurrent: delivered && os !== 'COMPLETED',
    },
  );

  const anyCurrent = steps.some((s) => s.isCurrent);
  if (paid && !anyCurrent && !delivered) {
    const lastDoneIdx = steps.map((s, i) => (s.done ? i : -1)).filter((i) => i >= 0).pop();
    if (lastDoneIdx != null && lastDoneIdx < steps.length - 1) {
      steps[lastDoneIdx + 1].isCurrent = true;
    }
  }

  return steps;
}

/** Chuẩn hóa OrderDTO từ BE cho bảng FE. */
export function normalizeOrderRow(o) {
  if (!o) return null;
  return {
    id: o.id,
    code: o.code || o.orderCode || o.id,
    customerName: o.customerName || '—',
    totalPrice: o.totalPrice ?? o.totalAmount ?? 0,
    orderStatus: o.orderStatus || o.status || '—',
    created: o.created || o.createdAt,
    depositedAt: o.depositedAt,
    completedAt: o.completedAt,
    totalItem: o.totalItem ?? o.items?.length ?? 0,
    shipment: o.shipment,
    invoice: o.invoice,
    items: o.items || [],
  };
}

export function normalizeOrderDetail(o) {
  const base = normalizeOrderRow(o);
  if (!base) return null;
  return {
    ...base,
    customerPhone: o.customerPhone,
    shippingAddress:
      o.shippingAddress ||
      o.shipment?.fullAddress ||
      [o.shipment?.addressLine, o.shipment?.ward, o.shipment?.district, o.shipment?.city]
        .filter(Boolean)
        .join(', '),
    note: o.note,
  };
}
