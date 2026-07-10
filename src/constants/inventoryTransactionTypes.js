import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  RollbackOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
} from '@ant-design/icons';

/** Khớp với InventoryTransactionTypes trên backend */
export const INVENTORY_TRANSACTION_TYPES = {
  PURCHASE_IN: {
    value: 'PURCHASE_IN',
    label: 'Nhập mua',
    color: 'green',
    hexColor: '#4CAF50',
    direction: 'IN',
    icon: ArrowDownOutlined,
    description: 'Nhập hàng từ nhà cung cấp',
    creatable: true,
  },
  PRODUCTION_IN: {
    value: 'PRODUCTION_IN',
    label: 'Nhập sản xuất',
    color: 'blue',
    hexColor: '#2196F3',
    direction: 'IN',
    icon: ToolOutlined,
    description: 'Sản phẩm in 3D hoàn thành, đưa vào kho',
    creatable: true,
  },
  ORDER_OUT: {
    value: 'ORDER_OUT',
    label: 'Xuất bán',
    color: 'orange',
    hexColor: '#FF9800',
    direction: 'OUT',
    icon: ShoppingCartOutlined,
    description: 'Xuất kho cho đơn hàng khách',
    creatable: false,
  },
  ADJUSTMENT: {
    value: 'ADJUSTMENT',
    label: 'Điều chỉnh',
    color: 'purple',
    hexColor: '#9C27B0',
    direction: 'BOTH',
    icon: SwapOutlined,
    description: 'Kiểm kê, hư hỏng hoặc cân bằng kho',
    creatable: true,
  },
  OrderCancelReturn: {
    value: 'OrderCancelReturn',
    label: 'Hoàn kho',
    color: 'cyan',
    hexColor: '#00897B',
    direction: 'IN',
    icon: RollbackOutlined,
    description: 'Nhập lại kho do hủy đơn',
    creatable: false,
  },
};

export const CREATABLE_TRANSACTION_TYPES = Object.values(INVENTORY_TRANSACTION_TYPES).filter(
  (t) => t.creatable,
);

export const DIRECTION_FILTERS = [
  { value: '', label: 'Tất cả hướng' },
  { value: 'IN', label: 'Nhập kho', color: 'green', icon: ArrowDownOutlined },
  { value: 'OUT', label: 'Xuất kho', color: 'red', icon: ArrowUpOutlined },
];

export const resolveTransactionType = (type, record = {}) => {
  const known = INVENTORY_TRANSACTION_TYPES[type];
  if (known) return known;

  const isInbound = record.isInbound ?? (record.quantity > 0);
  return {
    value: type,
    label: type || 'Không xác định',
    color: isInbound ? 'green' : 'red',
    hexColor: isInbound ? '#4CAF50' : '#FF9800',
    direction: isInbound ? 'IN' : 'OUT',
    icon: isInbound ? ArrowDownOutlined : ArrowUpOutlined,
    description: '',
    creatable: false,
  };
};

export const formatQuantityChange = (quantity) => {
  const qty = Number(quantity) || 0;
  const abs = Math.abs(qty);
  if (qty > 0) return { text: `+${abs}`, color: '#10b981', direction: 'IN' };
  if (qty < 0) return { text: `-${abs}`, color: '#ef4444', direction: 'OUT' };
  return { text: '0', color: '#6b7280', direction: 'NONE' };
};
