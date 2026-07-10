import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { getShippingQuotesApi } from '../../api/shipmentApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

/**
 * Báo phí và chọn GHN (POST /api/shipment/quotes).
 */
const ShippingCarrierSelect = ({
  shippingAddressId,
  ghnToDistrictId,
  ghnToWardCode,
  orderValue = 0,
  weightGrams = 500,
  collectOnDelivery = false,
  selectedCarrier = '',
  selectedFee = 0,
  onChange,
  className = '',
}) => {
  const canQuote =
    shippingAddressId
    || (ghnToDistrictId > 0 && ghnToWardCode && String(ghnToWardCode).trim());
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadQuotes = useCallback(async () => {
    if (!canQuote) {
      setQuotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        weightGrams,
        orderValue,
        collectOnDelivery,
      };
      if (shippingAddressId) payload.shippingAddressId = shippingAddressId;
      if (ghnToDistrictId > 0 && ghnToWardCode) {
        payload.ghnToDistrictId = ghnToDistrictId;
        payload.ghnToWardCode = String(ghnToWardCode).trim();
      }
      const res = await getShippingQuotesApi(payload);
      const rows = res?.data || [];
      setQuotes(Array.isArray(rows) ? rows : []);
      if (rows.length > 0 && !selectedCarrier) {
        const first = rows[0];
        onChange?.(first.carrier, first.fee);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không tính được phí vận chuyển');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [
    canQuote,
    shippingAddressId,
    ghnToDistrictId,
    ghnToWardCode,
    weightGrams,
    orderValue,
    collectOnDelivery,
    selectedCarrier,
    onChange,
  ]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  if (!canQuote) {
    return (
      <p className={`text-sm text-gray-500 ${className}`}>
        Chọn <strong>tỉnh → quận → phường GHN</strong> (địa chỉ mới) hoặc địa chỉ đã lưu để xem phí vận chuyển.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900">Giao hàng GHN</h3>
        <button
          type="button"
          onClick={loadQuotes}
          disabled={loading}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          {loading ? 'Đang tính…' : 'Tính lại phí'}
        </button>
      </div>

      {loading && quotes.length === 0 && (
        <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
          <Spin size="small" /> Đang lấy báo giá GHN…
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quotes.map((q) => {
          const active = selectedCarrier === q.carrier;
          return (
            <button
              key={q.carrier}
              type="button"
              onClick={() => onChange?.(q.carrier, q.fee)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                active
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900">{q.carrierName || q.carrier}</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">{formatPrice(q.fee)}</p>
              <p className="text-xs text-gray-500 mt-1">~{q.leadDays} ngày</p>
              {q.isEstimated && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  Phí ước tính
                </span>
              )}
              {q.message && (
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{q.message}</p>
              )}
            </button>
          );
        })}
      </div>

      {selectedCarrier && (
        <p className="text-xs text-green-700 mt-3 font-medium">
          Đã chọn {selectedCarrier} — phí ship {formatPrice(selectedFee)}
          {Number(selectedFee) === 0 && (
            <span className="block text-amber-700 mt-1 font-normal">
              GHN trả 0đ — thường do gửi cùng quận/phường mặc định (địa chỉ chưa có mã GHN). Tổng đơn sẽ không cộng phí ship.
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default ShippingCarrierSelect;
