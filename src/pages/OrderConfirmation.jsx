import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { getOrderDetailApi } from '../api/orderApi';
import { normalizeOrderDetail, resolveOrderIsCod } from '../utils/orderNormalize';
import { clearVnPayCheckoutPending, loadVnPayCheckoutPending } from '../utils/vnpayCheckoutSession';
import { resolveMainflow2ChatPath } from '../utils/mainflow2ReturnPath';

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-emerald-500">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-red-500">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const resolveConfirmationStatus = ({
  paidFromUrl,
  failedFromUrl,
  failureMessage,
  order,
  isPartiallyPaid,
}) => {
  if (failedFromUrl || failureMessage) {
    return {
      type: 'failure',
      title: 'Thanh toán thất bại',
      description: failureMessage || 'Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức khác.',
    };
  }

  const orderStatus = (order?.orderStatus || '').toUpperCase();
  const isInvoicePaid = (order?.invoice?.paymentStatus || '').toUpperCase() === 'PAID';
  const isCod = resolveOrderIsCod(order?.invoice);

  if (orderStatus === 'FAILED' || orderStatus === 'CANCELLED') {
    return {
      type: 'failure',
      title: orderStatus === 'CANCELLED' ? 'Đơn hàng đã hủy' : 'Đơn hàng thất bại',
      description: orderStatus === 'CANCELLED'
        ? 'Đơn hàng này đã bị hủy.'
        : 'Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    };
  }

  if (paidFromUrl || isInvoicePaid) {
    if (isPartiallyPaid) {
      return {
        type: 'success',
        title: 'Đặt cọc thành công!',
        description: 'Đã nhận cọc 30% tiền thiết kế. Nhân viên sẽ gửi bảng thiết kế trong chat — bạn có thể tiếp tục trao đổi tại đó.',
      };
    }
    return {
      type: 'success',
      title: 'Thanh toán thành công!',
      description: 'Cảm ơn bạn đã thanh toán. Đơn hàng đã được xác nhận và đang được xử lý.',
    };
  }

  if (isCod) {
    return {
      type: 'success',
      title: 'Đặt hàng thành công!',
      description: 'Cảm ơn bạn đã đặt hàng. Bạn sẽ thanh toán tiền mặt khi nhận hàng. Chúng tôi sẽ thông báo qua email khi đơn hàng sẵn sàng.',
    };
  }

  return {
    type: 'success',
    title: 'Đặt hàng thành công!',
    description: 'Cảm ơn bạn đã mua hàng. Đơn hàng đã được tiếp nhận và đang được xử lý. Chúng tôi sẽ thông báo qua email khi đơn hàng sẵn sàng.',
  };
};

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId') || location.state?.orderId;
  const codeFromUrl = searchParams.get('code');
  const paidFromUrl = searchParams.get('paid') === '1';
  const failedFromUrl = searchParams.get('failed') === '1';
  const failureMessage = searchParams.get('message') || location.state?.failureMessage || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const vnPaySession = useMemo(() => loadVnPayCheckoutPending(), []);

  useEffect(() => {
    if (paidFromUrl) {
      clearVnPayCheckoutPending();
    }
  }, [paidFromUrl]);

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
        setOrder(normalizeOrderDetail(orderData));
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
  const orderItems = order?.items || [];
  const isPartiallyPaid = (order?.invoice?.paymentStatus || '').toUpperCase() === 'PARTIALLY_PAID';
  const chatPath = vnPaySession?.returnTo || resolveMainflow2ChatPath(order);
  const shipment = order?.shipment || {};
  const shippingFee = shipment.shippingFee ?? order?.shippingFee ?? 0;
  const totalAmount = order?.totalPrice ?? order?.invoice?.totalAmount ?? 0;
  const subTotal = order?.subTotal ?? Math.max(0, totalAmount - shippingFee);

  const status = useMemo(
    () => resolveConfirmationStatus({
      paidFromUrl,
      failedFromUrl,
      failureMessage,
      order,
      isPartiallyPaid,
    }),
    [paidFromUrl, failedFromUrl, failureMessage, order, isPartiallyPaid],
  );

  const isFailure = status.type === 'failure';

  useEffect(() => {
    if (loading || isFailure || !chatPath) return;
    if (!(paidFromUrl || (order?.invoice?.paymentStatus || '').toUpperCase() === 'PAID' || isPartiallyPaid)) {
      return;
    }
    const timer = setTimeout(() => {
      clearVnPayCheckoutPending();
      navigate(chatPath, { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [loading, isFailure, chatPath, paidFromUrl, order, isPartiallyPaid, navigate]);

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
          <div className="flex justify-center mb-6">
            <XCircleIcon />
          </div>
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
        <div className={`h-1.5 ${isFailure ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}`} />

        <div className="p-8 sm:p-12">
          {/* Trạng thái thành công / thất bại */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              {isFailure ? <XCircleIcon /> : <CheckCircleIcon />}
            </div>
            <h1 className={`text-3xl font-bold mb-3 ${isFailure ? 'text-red-700' : 'text-gray-900'}`}>
              {status.title}
            </h1>
            <p className="text-gray-500 leading-relaxed max-w-lg mx-auto">
              {status.description}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl px-6 py-4 mb-6 border border-gray-100 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mã đơn hàng</p>
            <p className="text-xl font-bold text-indigo-600 font-mono">{orderCode || '—'}</p>
          </div>

          {/* Danh sách sản phẩm */}
          {order && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Chi tiết đơn hàng
              </h2>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[1fr_4rem_7rem_7rem] gap-3 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Sản phẩm</span>
                  <span className="text-center">SL</span>
                  <span className="text-right">Đơn giá</span>
                  <span className="text-right">Thành tiền</span>
                </div>

                {orderItems.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Không có sản phẩm trong đơn hàng.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {orderItems.map((item, idx) => {
                      const itemName = item.itemName || item.name || item.designVariantName || item.variantName || `Sản phẩm #${idx + 1}`;
                      const unitPrice = item.unitPrice ?? item.price ?? 0;
                      const quantity = item.quantityOrdered ?? item.quantity ?? 1;
                      const lineTotal = unitPrice * quantity;

                      return (
                        <div
                          key={item.id || idx}
                          className="px-4 py-3 sm:grid sm:grid-cols-[1fr_4rem_7rem_7rem] sm:gap-3 sm:items-center"
                        >
                          <p className="font-medium text-gray-900 text-sm mb-1 sm:mb-0">{itemName}</p>
                          <p className="text-sm text-gray-600 sm:text-center">
                            <span className="sm:hidden text-gray-400 mr-1">SL:</span>
                            {quantity}
                          </p>
                          <p className="text-sm text-gray-600 sm:text-right">
                            <span className="sm:hidden text-gray-400 mr-1">Đơn giá:</span>
                            {formatPrice(unitPrice)}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 sm:text-right">
                            <span className="sm:hidden text-gray-400 mr-1 font-normal">Thành tiền:</span>
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tổng tiền */}
          {order && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 mb-8 space-y-2">
              {shippingFee > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2" />
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-900">Tổng tiền</span>
                <span className="text-xl font-bold text-indigo-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isFailure ? (
              <>
                <Link
                  to={chatPath || `/orders/${orderId}`}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                >
                  {chatPath ? 'Quay lại chat' : 'Thanh toán lại'}
                  <ArrowRightIcon />
                </Link>
                <Link
                  to="/my-orders"
                  className="inline-flex items-center justify-center py-3 px-6 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  Xem đơn hàng của tôi
                </Link>
              </>
            ) : (
              <>
                {chatPath ? (
                  <Link
                    to={chatPath}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                  >
                    Quay lại chat đơn hàng
                    <ArrowRightIcon />
                  </Link>
                ) : (
                  <Link
                    to={`/orders/${orderId}`}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                  >
                    Xem chi tiết đơn hàng
                    <ArrowRightIcon />
                  </Link>
                )}
                {!chatPath && (
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center py-3 px-6 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    Tiếp tục mua sắm
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
