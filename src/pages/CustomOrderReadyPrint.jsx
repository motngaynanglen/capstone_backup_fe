import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spin, message, Modal } from 'antd';
import {
  getPrintableDesigns,
  getReprintableOrders,
  createPrintFromDesign,
  createReprintRequest,
} from '../api/mainflow2Api';
import DesignWorkFileCard from '../components/Mainflow2/DesignWorkFileCard';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const SOURCE_LABEL = {
  CUSTOM_QUOTE_MF2: 'Thiết kế đã xong',
  CUSTOM_FILE_PRINT_MF2: 'In file',
  AI_GENERATED: 'In AI',
  PRINT_FROM_DESIGN_MF2: 'In từ thiết kế',
  REPRINT_MF2: 'In lại',
};

const mergeReadyPrintItems = (reprintable, printable) => {
  const byId = new Map();

  (reprintable || []).forEach((item) => {
    byId.set(item.id, {
      ...item,
      action: item.sourceType === 'CUSTOM_QUOTE_MF2' ? 'printFromDesign' : 'reprint',
      checkoutSourceType:
        item.sourceType === 'CUSTOM_QUOTE_MF2' ? 'PRINT_FROM_DESIGN_MF2' : 'REPRINT_MF2',
      displayPrice: item.latestQuotedPrice,
    });
  });

  (printable || []).forEach((item) => {
    if (byId.has(item.id)) return;
    byId.set(item.id, {
      id: item.id,
      title: item.title,
      previewFileUrl: item.previewFileUrl,
      sourceType: 'CUSTOM_QUOTE_MF2',
      latestQuotedPrice: item.designFeePaid,
      displayPrice: item.designFeePaid,
      action: 'printFromDesign',
      checkoutSourceType: 'PRINT_FROM_DESIGN_MF2',
    });
  });

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created || 0) - new Date(a.created || 0),
  );
};

const CustomOrderReadyPrint = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [reprintable, setReprintable] = useState([]);
  const [printable, setPrintable] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [reprintRes, printRes] = await Promise.all([
          getReprintableOrders().catch(() => ({ data: [] })),
          getPrintableDesigns().catch(() => ({ data: [] })),
        ]);
        setReprintable(Array.isArray(reprintRes?.data) ? reprintRes.data : []);
        setPrintable(Array.isArray(printRes?.data) ? printRes.data : []);
      } catch (e) {
        console.error(e);
        message.error('Không tải được danh sách thiết kế / đơn in');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(
    () => mergeReadyPrintItems(reprintable, printable),
    [reprintable, printable],
  );

  const handleOrder = (item) => {
    const price = item.displayPrice ?? item.latestQuotedPrice;
    Modal.confirm({
      title: 'Đặt in sản phẩm này?',
      content: price
        ? `Giá in: ${formatPrice(price)}/đơn vị. Thanh toán một lần (Pre-Order) → vào sản xuất.`
        : 'Thanh toán một lần (Pre-Order) → vào sản xuất.',
      okText: 'Đặt hàng',
      onOk: async () => {
        setSubmittingId(item.id);
        try {
          const payload = { sourceDesignWorkId: item.id, quantity: 1 };
          const res = item.action === 'printFromDesign'
            ? await createPrintFromDesign({ ...payload, printPriority: 'can-bang' })
            : await createReprintRequest(payload);
          const raw = res?.data ?? res;
          const newId = typeof raw === 'object' && raw != null ? (raw.id ?? raw.Id) : raw;
          if (!newId) throw new Error('Không lấy được mã yêu cầu in');
          const checkoutSourceType = item.checkoutSourceType || 'REPRINT_MF2';
          const prefix = checkoutSourceType === 'PRINT_FROM_DESIGN_MF2' ? 'In' : 'In lại';
          message.success('Chuyển sang thanh toán.');
          navigate('/checkout', {
            state: {
              designWorkId: newId,
              designWorkSourceType: checkoutSourceType,
              designWorkName: `${prefix}: ${item.title || 'Sản phẩm'}`,
              designWorkPrice: price,
              designWorkDesignFee: 0,
            },
          });
        } catch (err) {
          message.error(err?.response?.data?.message || err?.response?.data?.data || 'Đặt in thất bại');
        } finally {
          setSubmittingId(null);
        }
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">In từ thiết kế / in lại</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết kế hoặc đơn in đã xong — chọn và thanh toán ngay (giống Pre-Order), theo dõi trong Đơn của tôi.
          </p>
        </div>
        <Link to="/custom-order" className="text-sm text-indigo-600 hover:underline">← Quay lại</Link>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Spin size="large" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-600">
          <p>Chưa có thiết kế hoặc đơn in nào sẵn sàng.</p>
          <Link to="/custom-order/request-design" className="inline-block mt-4 text-indigo-600 font-medium">
            Yêu cầu thiết kế mới →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
            >
              <DesignWorkFileCard fileUrl={item.previewFileUrl} label="File in" height={132} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-1 min-w-0">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {SOURCE_LABEL[item.sourceType] || item.sourceType}
                    {item.orderStatus ? ` · Đơn: ${item.orderStatus}` : ''}
                  </p>
                  {(item.displayPrice ?? item.latestQuotedPrice) != null && (
                    <p className="text-sm font-medium text-indigo-700 mt-2">
                      Giá in: {formatPrice(item.displayPrice ?? item.latestQuotedPrice)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={submittingId === item.id}
                  onClick={() => handleOrder(item)}
                  className="shrink-0 py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingId === item.id ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomOrderReadyPrint;
