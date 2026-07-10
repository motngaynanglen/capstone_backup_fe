import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatStockLabel } from '../../utils/catalogProduct';
import ProductModelViewer from './ProductModelViewer';

/** Thẻ sản phẩm — click vùng ảnh/tên → chi tiết; chỉ nút "Mua ngay" mới vào checkout. */
const ProductCard = ({ product, viewMode = 'grid', onQuickBuy, onAddToCart }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isGrid = viewMode === 'grid';
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const detailPath = `/products/${product.id}`;

  const goToDetail = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    navigate(detailPath);
  };

  return (
    <div
      className={`group rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden cursor-default hover:shadow-md transition-shadow duration-200 ${isGrid ? 'flex flex-col' : 'flex flex-row'}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={goToDetail}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToDetail(e);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative bg-slate-50 flex-shrink-0 overflow-hidden cursor-pointer ${isGrid ? 'aspect-[4/3]' : 'w-32 sm:w-44 h-28 sm:h-36'}`}
      >
        <ProductModelViewer
          className="absolute inset-0"
          src={product.modelSrc}
          fallbackId={product.id}
          poster={product.thumbnailUrl}
          cameraControls={hovered}
          showLoading={false}
          style={{ pointerEvents: hovered ? 'auto' : 'none' }}
        />
        {hovered && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full z-10 pointer-events-none">
            360°
          </div>
        )}
        {outOfStock && product.isAllowPreOrder && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm z-10 pointer-events-none">
            Đặt trước
          </span>
        )}
        {outOfStock && !product.isAllowPreOrder && (
          <span className="absolute left-2 top-2 rounded-full bg-slate-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm z-10 pointer-events-none">
            Hết hàng
          </span>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-1">
        <button
          type="button"
          onClick={goToDetail}
          className="text-left text-xs sm:text-sm font-medium text-slate-900 group-hover:text-indigo-600 line-clamp-2 m-0 bg-transparent border-0 p-0 cursor-pointer w-full"
        >
          {product.designTemplateName ? `${product.designTemplateName} — ${product.name}` : product.name}
        </button>
        <p className="text-[11px] text-slate-500 m-0">Chất liệu: {product.material}</p>
        <p className={`text-[11px] font-medium m-0 ${lowStock ? 'text-rose-500' : outOfStock ? 'text-slate-400' : 'text-emerald-600'}`}>
          {outOfStock
            ? (product.isAllowPreOrder ? 'Có thể đặt trước' : 'Hết hàng')
            : formatStockLabel(product.stock)}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goToDetail}
            className="text-sm sm:text-base font-semibold text-rose-600 bg-transparent border-0 p-0 cursor-pointer hover:text-rose-700"
          >
            {formatPrice(product.price)}
          </button>
          {(onAddToCart || onQuickBuy) && (
            <div className="hidden sm:flex items-center gap-1">
              {onAddToCart && (
                <button
                  type="button"
                  disabled={outOfStock && !product.isAllowPreOrder}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm giỏ
                </button>
              )}
              {onQuickBuy && (
                <button
                  type="button"
                  disabled={outOfStock && !product.isAllowPreOrder}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickBuy(product);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-indigo-500 px-3 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mua ngay
                </button>
              )}
            </div>
          )}
        </div>

        {!isGrid && (
          <p className="mt-1 text-[11px] text-slate-500 m-0">
            Xoay mô hình để xem chi tiết. Có thể chọn vật liệu khác nhau khi đặt in.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
