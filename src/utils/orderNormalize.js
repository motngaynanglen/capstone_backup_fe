const norm = (s) => (s || '').toUpperCase();

const CUSTOM_SOURCE_TYPES = new Set([
  'CUSTOM_QUOTE_MF2',
  'CUSTOM_FILE_PRINT_MF2',
  'AI_GENERATED',
  'PRE_ORDER',
  'REPRINT_MF2',
  'PRINT_FROM_DESIGN_MF2',
]);

export function orderHasCustomManufacturing(items) {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some((it) => CUSTOM_SOURCE_TYPES.has(norm(it.sourceType)));
}

export function orderHasPreOrder(items) {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some((it) => {
    const t = norm(it.sourceType);
    return t === 'PRE_ORDER' || t === 'REPRINT_MF2' || t === 'PRINT_FROM_DESIGN_MF2' || t === 'AI_GENERATED';
  });
}

/** COD = giao dịch CASH hoặc invoice.isCod từ BE. */
export function resolveOrderIsCod(invoice, transaction) {
  if (invoice?.isCod === true || invoice?.IsCod === true) return true;
  const txMethod = (transaction?.paymentMethod || transaction?.method || '').toUpperCase();
  const invoiceMethod = (invoice?.paymentMethod || invoice?.PaymentMethod || '').toUpperCase();
  return txMethod === 'CASH' || invoiceMethod === 'CASH';
}

/** Shop đã bắt đầu xử lý — PREPARING lúc checkout chỉ tính khi đã TT hoặc COD. */
function isShopProcessing(orderStatus, shipmentStatus, isInvoicePaid, isCod) {
  const os = norm(orderStatus);
  const ss = norm(shipmentStatus);
  if (os === 'PROCESSING') return true;
  if (ss === 'PREPARING' && (isInvoicePaid || isCod)) return true;
  return false;
}

/**
 * Badge + timeline khách — đồng bộ OrderStatuses + ShipmentStatuses từ BE.
 */
export function resolveCustomerOrderDisplayStatus(
  orderStatus,
  shipmentStatus,
  isInvoicePaid,
  items,
  isCod = false,
) {
  const os = norm(orderStatus);
  const ss = norm(shipmentStatus);
  const customMfg = orderHasCustomManufacturing(items);
  const shopProcessing = isShopProcessing(orderStatus, shipmentStatus, isInvoicePaid, isCod);

  if (os === 'CANCELLED') return { key: 'CANCELLED', label: 'Đã hủy' };
  if (os === 'COMPLETED') return { key: 'COMPLETED', label: 'Hoàn thành' };
  if (ss === 'DELIVERED') return { key: 'COMPLETED', label: 'Đã giao hàng' };
  if (ss === 'IN_TRANSIT') return { key: 'SHIPPING', label: 'Đang giao hàng' };

  if (customMfg) {
    if (os === 'FINISHED' || ss === 'READY_FOR_PICKUP') {
      return { key: 'READY_FOR_SHIP', label: 'Sẵn sàng giao (chờ GHN)' };
    }
    if (shopProcessing) {
      return { key: 'PRODUCTION', label: 'Đang sản xuất / in 3D' };
    }
  } else {
    if (os === 'FINISHED' || ss === 'READY_FOR_PICKUP') {
      return { key: 'FINISHED', label: 'Chờ giao hàng' };
    }
    if (shopProcessing) {
      return { key: 'PROCESSING', label: 'Đang chuẩn bị hàng' };
    }
  }

  if (isCod && !isInvoicePaid && os === 'PENDING') {
    return { key: 'COD', label: 'COD · thu tiền khi giao' };
  }
  if (os === 'PENDING' && isInvoicePaid) return { key: 'PAID', label: 'Đã thanh toán · chờ xử lý' };
  if (os === 'PENDING') return { key: 'PENDING', label: 'Chờ thanh toán' };
  return { key: os || 'PENDING', label: os || 'Chờ xử lý' };
}

/**
 * Timeline khách — tách rõ sản xuất vs giao hàng (flow 2/3 / pre-order).
 */
export function buildCustomerTrackingSteps(
  orderStatus,
  shipmentStatus,
  isInvoicePaid,
  items,
  isCod = false,
) {
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
  const shopProcessing = isShopProcessing(orderStatus, shipmentStatus, isInvoicePaid, isCod);

  const productionComplete =
    ['FINISHED', 'COMPLETED'].includes(os) ||
    ['READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(ss);

  const inProduction = shopProcessing && !productionComplete;

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
  ];

  if (isCod) {
    steps.push({
      key: 'cod',
      label: paid ? 'Đã thu COD' : 'COD · thu khi giao',
      description: paid
        ? 'Đã thu tiền mặt khi giao hàng thành công.'
        : 'Thanh toán khi nhận hàng — không cần trả trước.',
      done: paid,
      isCurrent: !paid && os === 'PENDING' && !shopProcessing,
    });
  } else {
    steps.push({
      key: 'paid',
      label: 'Đã thanh toán',
      description: 'Thanh toán đã được xác nhận — đưa vào hàng đợi sản xuất.',
      done: paid,
      isCurrent: !paid && os === 'PENDING' && !shopProcessing,
    });
  }

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
  if (!anyCurrent && !delivered) {
    if (paid) {
      const lastDoneIdx = steps.map((s, i) => (s.done ? i : -1)).filter((i) => i >= 0).pop();
      if (lastDoneIdx != null && lastDoneIdx < steps.length - 1) {
        steps[lastDoneIdx + 1].isCurrent = true;
      }
    } else if (isCod && shopProcessing) {
      const nextStep = steps.find(
        (s) => !s.done && ['processing', 'production', 'ready_for_ship'].includes(s.key),
      );
      if (nextStep) nextStep.isCurrent = true;
    }
  }

  return steps;
}

/** Khách có thể gửi đánh giá khi đơn hoàn tất hoặc shipment đã DELIVERED. */
export function canSubmitOrderFeedback(orderStatus, shipmentStatus, completedAt) {
  if (completedAt) return true;
  const os = norm(orderStatus);
  const ss = norm(shipmentStatus);
  return os === 'COMPLETED' || ss === 'DELIVERED';
}

function normalizeOrderItem(it) {
  if (!it) return it;
  const fb = it.feedback || it.Feedback;
  return {
    ...it,
    id: it.id ?? it.Id,
    designWorkId: it.designWorkId ?? it.DesignWorkId,
    itemName: it.itemName ?? it.ItemName,
    thumbnailUrl: it.thumbnailUrl ?? it.ThumbnailUrl,
    sourceType: it.sourceType ?? it.SourceType,
    quantityOrdered: it.quantityOrdered ?? it.QuantityOrdered,
    unitPrice: it.unitPrice ?? it.UnitPrice,
    totalPrice: it.totalPrice ?? it.TotalPrice,
    fulfillmentStatus: it.fulfillmentStatus ?? it.FulfillmentStatus,
    canSubmitFeedback:
      it.canSubmitFeedback !== undefined
        ? Boolean(it.canSubmitFeedback)
        : it.CanSubmitFeedback !== undefined
          ? Boolean(it.CanSubmitFeedback)
          : undefined,
    feedback: fb
      ? {
          id: fb.id ?? fb.Id,
          rating: fb.rating ?? fb.Rating,
          comment: fb.comment ?? fb.Comment,
          staffReply: fb.staffReply ?? fb.StaffReply,
          created: fb.created ?? fb.Created,
          imageUrls: fb.imageUrls ?? fb.ImageUrls ?? [],
        }
      : null,
  };
}

/** Chuẩn hóa OrderDTO từ BE cho bảng FE. */
export function normalizeOrderRow(o) {
  if (!o) return null;
  const invoice = o.invoice || o.Invoice;
  const paymentMethod = (invoice?.paymentMethod || invoice?.PaymentMethod || '').toUpperCase();
  const isCod = Boolean(invoice?.isCod ?? invoice?.IsCod ?? paymentMethod === 'CASH');
  return {
    id: o.id,
    code: o.code || o.orderCode || o.id,
    customerName: o.customerName || '—',
    totalPrice: o.totalPrice ?? o.totalAmount ?? 0,
    orderStatus: o.orderStatus || o.status || '—',
    created: o.created || o.createdAt,
    depositedAt: o.depositedAt,
    completedAt: o.completedAt ?? o.CompletedAt,
    totalItem: o.totalItem ?? o.items?.length ?? o.orderItems?.length ?? 0,
    shipment: o.shipment || o.Shipment,
    invoice: invoice
      ? {
          ...invoice,
          paymentMethod: invoice.paymentMethod || invoice.PaymentMethod,
          paymentStatus: invoice.paymentStatus || invoice.PaymentStatus,
          designFeeAmount: invoice.designFeeAmount ?? invoice.DesignFeeAmount,
          customDepositAmount: invoice.customDepositAmount ?? invoice.CustomDepositAmount,
          remainingBalance: invoice.remainingBalance ?? invoice.RemainingBalance,
          isCod,
        }
      : undefined,
    items: (o.items || o.orderItems || o.OrderItems || []).map(normalizeOrderItem),
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
