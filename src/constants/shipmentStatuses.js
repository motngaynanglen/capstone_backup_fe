/** Đồng bộ với be/src/Domain/Constants/Statuses/ShipmentStatuses.cs */
export const SHIPMENT_STATUS = {
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
};

export const SHIPMENT_STATUS_META = {
  PREPARING: { label: 'Đang đóng gói', color: 'gold' },
  READY_FOR_PICKUP: { label: 'Chờ lấy hàng', color: 'orange' },
  IN_TRANSIT: { label: 'Đang giao', color: 'processing' },
  DELIVERED: { label: 'Đã giao hàng', color: 'success' },
};

export const ORDER_STATUS_META = {
  PROCESSING: { label: 'Đang xử lý' },
  FINISHED: { label: 'Sẵn sàng giao' },
  COMPLETED: { label: 'Hoàn thành' },
};
