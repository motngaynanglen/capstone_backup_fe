import React, { useEffect, useState } from 'react';
import { useLocation, Link, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { getOrderDetailApi } from '../api/orderApi';

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-emerald-500">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const OrderConfirmation = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId') || location.state?.orderId;
  const codeFromUrl = searchParams.get('code');
  const paidFromUrl = searchParams.get('paid') === '1';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Không tìm thấy mã đơn hàng.');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOrderDetailApi(orderId);
        const orderData = response?.data || response;
        setOrder(orderData);
      } catch (err) {
        console.error('Failed to fetch order confirmation:', err);
        setError(
          err?.response?.data?.detail
          || err?.response?.data?.message
          || err?.response?.data?.title
          || 'Không thể tải thông tin đơn hàng.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const orderCode = order?.code || codeFromUrl || location.state?.orderCode;
  const isPaid = paidFromUrl
    || order?.invoice?.paymentStatus?.toUpperCase() === 'PAID'
    || ['PAID', 'PROCESSING', 'CONFIRMED', 'FINISHED', 'SHIPPING', 'COMPLETED'].includes(
      (order?.orderStatus || '').toUpperCase(),
    );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex justify-center">
        <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Không thể hiển thị đơn hàng</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link
            to="/my-orders"
            className="inline-flex items-center justify-center py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200"
          >
            Xem đơn hàng của tôi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-emerald-500" />

        <div className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isPaid ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {isPaid
              ? 'Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận và đang được xử lý. Chúng tôi sẽ thông báo qua email khi đơn hàng sẵn sàng.'
              : 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý. Chúng tôi sẽ thông báo qua email khi đơn hàng sẵn sàng.'}
          </p>

          <div className="bg-gray-50 rounded-xl px-8 py-5 mb-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mã đơn hàng</p>
            <p className="text-xl font-bold text-indigo-600 font-mono">{orderCode || '—'}</p>
          </div>

          {order && (
            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tổng tiền</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatPrice(order.invoice?.totalAmount ?? order.totalPrice)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Số sản phẩm</p>
                <p className="text-base font-semibold text-gray-900">{order.totalItem ?? order.items?.length ?? 0}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
            >
              Xem chi tiết đơn hàng
              <ArrowRightIcon />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center py-3 px-6 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
