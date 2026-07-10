import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { resolveCartItemSourceType } from '../utils/catalogProduct';

const getItemKey = (item) => `${item.product?.id}::${item.material}`;

// SVG Icons
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const SOURCE_TYPE_CONFIG = {
  in_stock: {
    label: 'Sẵn hàng',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    icon: <PackageIcon />,
  },
  pre_order: {
    label: 'Pre-order',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    icon: <ClockIcon />,
  },
  custom: {
    label: 'Custom Design',
    className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    icon: <SparklesIcon />,
  },
};

const StatusBadge = ({ sourceType }) => {
  const config = SOURCE_TYPE_CONFIG[sourceType] || SOURCE_TYPE_CONFIG.in_stock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const CartCheckbox = ({ checked, indeterminate, onChange, label }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate);
      }}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
      aria-label={label}
    />
    {label ? <span className="text-sm text-gray-700">{label}</span> : null}
  </label>
);

const ShoppingCart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart } = useCart();
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const knownKeysRef = useRef(new Set());

  useEffect(() => {
    const currentKeys = items.map(getItemKey);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of currentKeys) {
        if (!knownKeysRef.current.has(key)) {
          next.add(key);
          knownKeysRef.current.add(key);
        }
      }
      for (const key of [...next]) {
        if (!currentKeys.includes(key)) {
          next.delete(key);
          knownKeysRef.current.delete(key);
        }
      }
      return next;
    });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(getItemKey(item))),
    [items, selectedKeys]
  );

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && !allSelected;

  const toggleItem = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(items.map(getItemKey)));
    }
  };

  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce((sum, i) => {
        const price = Number(i.product?.price) || 0;
        const qty = Number(i.quantity);
        return sum + price * (Number.isFinite(qty) && qty > 0 ? qty : 1);
      }, 0),
    [selectedItems]
  );

  const hasPreOrder = selectedItems.some((i) => resolveCartItemSourceType(i) === 'pre_order');
  const hasCustom = selectedItems.some((i) => resolveCartItemSourceType(i) === 'custom');
  const showDeliveryWarning = hasPreOrder || hasCustom;

  const shipping = selectedItems.length > 0 ? 30000 : 0;
  const total = selectedSubtotal + shipping;

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-gray-300">
            <ShoppingBagIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Giỏ hàng trống</h1>
          <p className="text-gray-500">Thêm sản phẩm vào giỏ để bắt đầu mua sắm!</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer no-underline"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
        <p className="text-gray-500 mt-1">
          {items.length} sản phẩm trong giỏ
          {selectedItems.length < items.length && (
            <span> · Đã chọn {selectedItems.length}</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between">
            <CartCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
              label="Chọn tất cả"
            />
            <span className="text-xs text-gray-500">
              {selectedItems.length}/{items.length} sản phẩm
            </span>
          </div>

          {items.map((item, idx) => {
            const itemKey = getItemKey(item);
            const isSelected = selectedKeys.has(itemKey);

            return (
            <div
              key={`${item.product.id}-${item.material}-${idx}`}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all duration-200 ${
                isSelected ? '' : 'opacity-60'
              }`}
            >
              <CartCheckbox
                checked={isSelected}
                onChange={() => toggleItem(itemKey)}
                label=""
              />
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 relative">
                {/* Dùng model-viewer hoặc image tĩnh tuỳ data, nếu có modelSrc dùng model-viewer (camera-controls false để ko bị nhiễu) */}
                {item.product.modelSrc ? (
                  <model-viewer
                    src={item.product.modelSrc}
                    auto-rotate
                    shadow-intensity="0.8"
                    environment-image="neutral"
                    interaction-prompt="none"
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                  />
                ) : (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Vật liệu: {item.material}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id, item.material)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-150 cursor-pointer flex-shrink-0 p-1"
                    aria-label="Xoá sản phẩm"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="mb-3">
                  <StatusBadge sourceType={resolveCartItemSourceType(item)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.material, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 cursor-pointer font-medium"
                      aria-label="Giảm số lượng"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.material, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 cursor-pointer font-medium"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-indigo-600 text-sm">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Tóm tắt đơn hàng</h2>

            {/* Item type legend */}
            <div className="space-y-2 pb-4 border-b border-gray-100">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-gray-400 m-0">Chưa chọn sản phẩm nào</p>
              ) : (
                selectedItems.map((item, idx) => (
                  <div key={`${item.product.id}-${item.material}-${idx}`} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 min-w-0 max-w-[65%]">
                      <span className="truncate text-gray-700">{item.product.name}</span>
                      <div className="scale-75 origin-left hidden xl:block">
                        <StatusBadge sourceType={resolveCartItemSourceType(item)} />
                      </div>
                    </div>
                    <span className="font-medium text-gray-900 flex-shrink-0 ml-2">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-medium text-gray-900">{formatPrice(selectedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="font-medium text-gray-900">{formatPrice(shipping)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-indigo-600 text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Delivery Warning */}
            {showDeliveryWarning && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
                <ExclamationIcon />
                <p>
                  Đơn hàng sẽ được gộp và giao sau khi{' '}
                  {hasCustom ? 'hoàn thiện thiết kế & in ấn' : 'hoàn tất in ấn'}{' '}
                  (ước tính <strong>{hasCustom ? '5–7' : '3–5'} ngày</strong>).
                </p>
              </div>
            )}

            <button
              onClick={() => {
                const cartItems = selectedItems.map((item) => {
                  const sourceType = resolveCartItemSourceType(item);
                  return {
                    variantId: item.product.id != null ? String(item.product.id) : undefined,
                    name: item.product.name,
                    designTemplateName: item.product.designTemplateName,
                    price: item.product.price,
                    quantity: item.quantity,
                    material: item.material,
                    modelSrc: item.product.modelSrc,
                    stock: item.product.stock,
                    isAllowPreOrder: item.product.isAllowPreOrder,
                    sourceType: sourceType === 'pre_order' ? 'PRE_ORDER' : 'IN_STOCK',
                  };
                });
                navigate('/checkout', { state: { cartItems } });
              }}
              disabled={selectedItems.length === 0}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              Tiến hành thanh toán{selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}
            </button>
            <Link
              to="/products"
              className="block w-full py-3 text-center bg-gray-50 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200 no-underline"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
