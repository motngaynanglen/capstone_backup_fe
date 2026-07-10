import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const requestSeq = useRef(0);
  const onChangeRef = useRef(onChange);
  const selectedCarrierRef = useRef(selectedCarrier);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    selectedCarrierRef.current = selectedCarrier;
  }, [selectedCarrier]);

  const loadQuotes = useCallback(async () => {
    if (!canQuote) {
      setQuotes([]);
      return;
    }

    const seq = ++requestSeq.current;
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
      if (seq !== requestSeq.current) return;

      const list = Array.isArray(res?.data) ? res.data : [];
      setQuotes(list);

      if (list.length > 0) {
        const picked = list.find((q) => q.carrier === selectedCarrierRef.current) || list[0];
        onChangeRef.current?.(picked.carrier, picked.fee);
      } else if (!selectedCarrierRef.current) {
        onChangeRef.current?.('', 0);
      }
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e?.response?.data?.message || e?.message || 'Không tính được phí vận chuyển');
      setQuotes([]);
      if (!selectedCarrierRef.current) {
        onChangeRef.current?.('', 0);
      }
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [
    canQuote,
    shippingAddressId,
    ghnToDistrictId,
    ghnToWardCode,
    weightGrams,
    orderValue,
    collectOnDelivery,
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

      {loading && quotes.length === 0 && !selectedCarrier && (
        <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
          <Spin size="small" /> Đang lấy báo giá GHN…
        </div>
      )}

      {loading && selectedCarrier && (
        <p className="text-xs text-slate-500 mb-2">Đang cập nhật phí ship…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(quotes.length > 0 ? quotes : selectedCarrier ? [{
          carrier: selectedCarrier,
          carrierName: 'Giao Hàng Nhanh (GHN)',
          fee: selectedFee,
          leadDays: 3,
          isEstimated: false,
        }] : []).map((q) => {
          const active = selectedCarrier === q.carrier;
          return (
            <button
              key={q.carrier}
              type="button"
              onClick={() => onChangeRef.current?.(q.carrier, q.fee)}
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
          {collectOnDelivery && (
            <span className="block text-slate-600 mt-1 font-normal">
              COD: thu tiền hàng + phí ship khi giao — không thanh toán trước online.
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default ShippingCarrierSelect;
