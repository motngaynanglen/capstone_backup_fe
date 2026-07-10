import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb, Spin, notification, Modal } from 'antd';
import { getOrderDetailApi, cancelOrderApi } from '../api/orderApi';
import { getShipmentByOrderApi } from '../api/shipmentApi';
import transactionApi from '../api/transactionApi';
import { isCustomPrintSourceType, isDirectPrintSourceType } from '../api/mainflow2Api';
import { buildCustomerTrackingSteps, resolveCustomerOrderDisplayStatus, normalizeOrderDetail, resolveOrderIsCod } from '../utils/orderNormalize';
import { saveVnPayCheckoutPending } from '../utils/vnpayCheckoutSession';
import { resolveMainflow2ChatPath } from '../utils/mainflow2ReturnPath';
import OrderFeedbackSection from '../components/Orders/OrderFeedbackSection';

// ... (keep previous icons and configs)

// SVG Icons
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

const CheckCircleSolidIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

// ─── SOURCE TYPE BADGES (loại nguồn hàng)
const SOURCE_TYPE_CONFIG = {
  IN_STOCK: { label: 'Sẵn hàng', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <PackageIcon /> },
  PRE_ORDER: { label: 'Pre-Order', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: <ClockIcon /> },
  DESIGN_SERVICE: { label: 'Dịch vụ thiết kế', className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', icon: <SparklesIcon /> },
  PRINT_SERVICE: { label: 'Dịch vụ in', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', icon: <PackageIcon /> },
  CUSTOM_QUOTE_MF2: { label: 'Thiết kế riêng', className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', icon: <SparklesIcon /> },
  // Fallback lowercase
  in_stock: { label: 'Sẵn hàng', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <PackageIcon /> },
  pre_order: { label: 'Pre-Order', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: <ClockIcon /> },
  custom: { label: 'Custom Design', className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', icon: <SparklesIcon /> },
};

// ─── FULFILLMENT STATUS BADGES cho từng OrderItem
const FULFILLMENT_CONFIG = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-gray-100 text-gray-500' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-600' },
  PRODUCING: { label: 'Đang sản xuất', className: 'bg-orange-50 text-orange-600' },
  PREPARING: { label: 'Đang chuẩn bị', className: 'bg-amber-50 text-amber-600' },
  FINISHED: { label: 'Hoàn tất', className: 'bg-emerald-50 text-emerald-600' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-600' },
  // lowercase fallback
  pending: { label: 'Chờ xử lý', className: 'bg-gray-100 text-gray-500' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-600' },
  producing: { label: 'Đang sản xuất', className: 'bg-orange-50 text-orange-600' },
  preparing: { label: 'Đang chuẩn bị', className: 'bg-amber-50 text-amber-600' },
  finished: { label: 'Hoàn tất', className: 'bg-emerald-50 text-emerald-600' },
  delivered: { label: 'Đã giao', className: 'bg-emerald-50 text-emerald-600' },
  failed: { label: 'Thất bại', className: 'bg-red-50 text-red-600' },
};

// ─── ORDER STATUS BADGES (cấp Order) — đồng bộ BE: PENDING / PROCESSING / FINISHED / COMPLETED
const ORDER_STATUS_CONFIG = {
  COD: { label: 'COD · thu khi giao', className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  CREATED: { label: 'Chờ thanh toán', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  PAID: { label: 'Đã thanh toán', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  PROCESSING: { label: 'Đang xử lý', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  FINISHED: { label: 'Chờ giao hàng', className: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200' },
  SHIPPING: { label: 'Đang vận chuyển', className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  FAILED: { label: 'Thất bại', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  pending: { label: 'Chờ thanh toán', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  created: { label: 'Chờ thanh toán', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  paid: { label: 'Đã thanh toán', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  processing: { label: 'Đang xử lý', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  finished: { label: 'Chờ giao hàng', className: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200' },
  shipping: { label: 'Đang vận chuyển', className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  completed: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  failed: { label: 'Thất bại', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
};

const ItemSourceBadge = ({ sourceType }) => {
  const config = SOURCE_TYPE_CONFIG[sourceType] || SOURCE_TYPE_CONFIG.IN_STOCK;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const FulfillmentBadge = ({ status }) => {
  const config = FULFILLMENT_CONFIG[status] || FULFILLMENT_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const OrderStatusBadge = ({ status, label }) => {
  const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {label || config.label}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [payingNow, setPayingNow] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const reloadOrder = async () => {
    const response = await getOrderDetailApi(id);
    const orderData = response?.data || response;
    setOrder(normalizeOrderDetail(orderData) || orderData);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        await reloadOrder();
      } catch (err) {
        console.error('Failed to fetch order detail:', err);
        setError(err?.response?.data?.message || err?.response?.data?.title || 'Không thể tải thông tin đơn hàng.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch transaction & shipment info
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const tRes = await transactionApi.getByOrderId(id);
        setTransaction(tRes?.data || tRes);
      } catch (e) { console.log('No transaction', e); }

      try {
        const sRes = await getShipmentByOrderApi(id);
        setShipment(sRes?.data || sRes);
      } catch (e) { console.log('No shipment', e); }
    };
    fetchData();
  }, [id]);

  // Thanh toán ngay (cho đơn chưa thanh toán)
  const handlePayNow = async (method = 'VNPAY') => {
    const customItems = (order?.items || order?.orderItems || []).filter((i) =>
      isCustomPrintSourceType(i.sourceType),
    );
    const isDirectPrintOnly = customItems.length > 0
      && customItems.every((i) => isDirectPrintSourceType(i.sourceType));
    const isCustomMf2 = customItems.length > 0 && !isDirectPrintOnly;
    const payStatus = (order?.invoice?.paymentStatus || '').toUpperCase();
    const paymentPhase = isDirectPrintOnly
      ? 'FULL'
      : isCustomMf2
        ? (payStatus === 'PARTIALLY_PAID' ? 'BALANCE' : 'DEPOSIT')
        : 'FULL';
    const chatPath = location.state?.returnTo || resolveMainflow2ChatPath(order);

    try {
      setPayingNow(true);
      const res = await transactionApi.performTransaction({
        orderId: id,
        paymentMethod: method,
        paymentPhase,
      });
      console.log('Perform transaction response:', res);
      const txData = res?.data || res;

      const paymentUrl = txData?.checkoutUrl || txData?.paymentUrl || txData?.paymentLink;
      if (method === 'VNPAY' && paymentUrl) {
        const items = order?.items || order?.orderItems || [];
        saveVnPayCheckoutPending({
          cartItems: items.map((it) => ({
            designWorkId: it.designWorkId,
            sourceType: it.sourceType,
            name: it.itemName || it.name,
            price: it.unitPrice || it.price || 0,
            quantity: it.quantityOrdered ?? it.quantity ?? 1,
          })),
          orderId: id,
          orderCode: order?.code || order?.orderCode,
          paymentMethod: 'VNPAY',
          paymentPhase,
          returnTo: chatPath,
          savedAt: Date.now(),
        });
        window.location.href = paymentUrl;
        return;
      }

      // CASH / COD → quay lại chat MF2 hoặc reload
      notification.success({
        message: method === 'CASH' ? 'Đã chọn COD' : 'Thanh toán thành công',
        description: method === 'CASH'
          ? 'Đơn COD — thanh toán khi nhận hàng.'
          : 'Đơn hàng đã được xác nhận thanh toán.',
        placement: 'topRight',
      });
      if (chatPath) {
        navigate(chatPath, { replace: true });
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Payment error:', err);
      notification.error({
        message: 'Thanh toán thất bại',
        description: err?.response?.data?.message || err?.response?.data?.title || 'Có lỗi xảy ra khi thanh toán.',
        placement: 'topRight',
      });
    } finally {
      setPayingNow(false);
    }
  };

  const handleCancelOrder = () => {
    Modal.confirm({
      title: 'Hủy đơn hàng',
      content: 'Đơn chưa thanh toán sẽ bị hủy. Bạn có chắc chắn không?',
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Giữ đơn',
      onOk: async () => {
        try {
          setCancelling(true);
          const res = await cancelOrderApi(id, 'Khách hủy đơn');
          if (res?.statusCode === 200) {
            notification.success({
              message: 'Đã hủy đơn hàng',
              placement: 'topRight',
            });
            window.location.reload();
          } else {
            notification.error({
              message: 'Không thể hủy đơn',
              description: res?.message || 'Vui lòng thử lại.',
              placement: 'topRight',
            });
          }
        } catch (err) {
          notification.error({
            message: 'Không thể hủy đơn',
            description: err?.response?.data?.message || err?.message || 'Vui lòng thử lại.',
            placement: 'topRight',
          });
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const formatPrice = (price) => {
    if (price == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  // Error
  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đơn hàng không tồn tại</h2>
        <p className="text-gray-500 mb-6">{error || 'Chúng tôi không tìm thấy thông tin đơn hàng này.'}</p>
        <Link to="/my-orders" className="text-indigo-600 font-medium hover:underline">
          Quay lại danh sách Đơn hàng
        </Link>
      </div>
    );
  }

  // Normalize data — backend: PENDING / PROCESSING / FINISHED / COMPLETED + invoice / shipment
  const orderStatus = order.orderStatus || order.status || 'PENDING';
  const orderItems = order.items || order.orderItems || [];
  const orderNote = order.note || '';
  const orderCode = order.code || order.orderCode || id;
  const createdDate = order.createdAt || order.created || order.date || '';
  const orderShipment = order.shipment || shipment || {};
  const shippingAddress = order.shippingAddress || orderShipment.shippingAddress || (
    orderShipment.fullAddress
      ? { fullAddress: orderShipment.fullAddress }
      : {}
  );
  const invoice = order.invoice || null;
  const isInvoicePaid = (invoice?.paymentStatus || '').toUpperCase() === 'PAID';
  const isPartiallyPaid = (invoice?.paymentStatus || '').toUpperCase() === 'PARTIALLY_PAID';
  const isDirectPrintOnlyOrder = orderItems.length > 0
    && orderItems.every((i) => isDirectPrintSourceType(i.sourceType));
  const isCustomMf2Order = orderItems.some((i) => isCustomPrintSourceType(i.sourceType))
    && !isDirectPrintOnlyOrder;
  const isCod = resolveOrderIsCod(invoice, transaction);
  const totalAmount = order.totalPrice ?? order.totalAmount ?? order.total ?? invoice?.totalAmount ?? 0;
  const shippingFee = orderShipment.shippingFee ?? order.shippingFee ?? 0;
  const subTotal = order.subTotal ?? order.subtotal ?? Math.max(0, totalAmount - shippingFee);
  const taxAmount = order.tax ?? order.taxAmount ?? 0;
  const sourceType = order.sourceType || '';
  const shipmentStatus = orderShipment.shipmentStatus || shipment?.shipmentStatus || '';

  const hasPreOrder = sourceType.toUpperCase() === 'PRE_ORDER' || orderItems.some(i => (i.sourceType || '').toUpperCase() === 'PRE_ORDER');
  const hasCustom = orderItems.some(i => (i.sourceType || '').toUpperCase().includes('SERVICE'));
  const isFailed = orderStatus.toUpperCase() === 'FAILED' || orderStatus.toUpperCase() === 'CANCELLED';
  const canCancelOrder = !isInvoicePaid
    && orderStatus.toUpperCase() === 'PENDING'
    && orderStatus.toUpperCase() !== 'CANCELLED';
  const displayStatus = resolveCustomerOrderDisplayStatus(
    orderStatus, shipmentStatus, isInvoicePaid, orderItems, isCod,
  );
  const trackingSteps = buildCustomerTrackingSteps(
    orderStatus, shipmentStatus, isInvoicePaid, orderItems, isCod,
  );
  const txStatus = (transaction?.transactionStatus || transaction?.status || '').toUpperCase();
  const txMethod = transaction?.paymentMethod || transaction?.method || '';
  const txAmount = transaction?.amount ?? transaction?.totalAmount ?? invoice?.totalAmount ?? totalAmount;
  const chatPath = location.state?.returnTo || resolveMainflow2ChatPath(order);
  const customDepositAmount = invoice?.customDepositAmount ?? invoice?.CustomDepositAmount;
  const remainingBalance = invoice?.remainingBalance ?? invoice?.RemainingBalance;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: <Link to="/">Trang chủ</Link> },
            { title: <Link to="/my-orders">Đơn hàng của tôi</Link> },
            { title: `Chi tiết đơn hàng` },
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
          <p className="text-gray-500 mt-1">
            Mã đơn: <span className="font-mono font-semibold text-gray-700">{orderCode}</span>
            {createdDate && <> · Đặt ngày {formatDate(createdDate)}</>}
          </p>
        </div>
        <OrderStatusBadge status={displayStatus.key} label={displayStatus.label} />
      </div>

      {/* Failed banner */}
      {isFailed && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
          <XCircleIcon />
          <div>
            <p className="font-semibold text-sm">
              {orderStatus.toUpperCase() === 'CANCELLED' ? 'Đơn hàng đã hủy' : 'Đơn hàng thất bại'}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {orderStatus.toUpperCase() === 'CANCELLED'
                ? 'Đơn hàng này đã bị hủy.'
                : 'Thanh toán không thành công. Vui lòng liên hệ hỗ trợ nếu cần thiết.'}
            </p>
          </div>
        </div>
      )}

      {/* Note */}
      {orderNote && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-blue-50 rounded-2xl border border-blue-200 text-blue-700">
          <ExclamationIcon />
          <div>
            <p className="font-semibold text-sm">Ghi chú đơn hàng</p>
            <p className="text-xs mt-0.5">{orderNote}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Sản phẩm ({orderItems.length})</h2>
            </div>

            {/* Delivery notice for pre-order/custom */}
            {(hasPreOrder || hasCustom) && !isFailed && (
              <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
                <ExclamationIcon />
                <p>
                  Đơn hàng có sản phẩm <strong>{hasCustom ? 'Dịch vụ' : 'Pre-Order'}</strong> —
                  sẽ chuyển sang trạng thái <em>Đang sản xuất</em> trước khi chuẩn bị giao.
                </p>
              </div>
            )}

            {orderItems.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Không có sản phẩm trong đơn hàng này.</p>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item, idx) => {
                  const itemName = item.itemName || item.name || item.designVariantName || item.variantName || `Sản phẩm #${idx + 1}`;
                  const itemPrice = item.unitPrice || item.price || 0;
                  const itemQty = item.quantityOrdered ?? item.quantity ?? 1;
                  const itemImg = item.thumbnailUrl || item.image || item.imageUrl || null;
                  const itemSourceType = item.sourceType || sourceType || 'IN_STOCK';
                  const itemFulfillment = item.fulfillmentStatus || item.status || 'PENDING';
                  const itemMaterial = item.materialName || item.material || '';

                  return (
                    <div key={item.id || idx} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-b-0 last:pb-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {itemImg ? (
                          <img src={itemImg} alt={itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2">{itemName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <ItemSourceBadge sourceType={itemSourceType} />
                          <FulfillmentBadge status={itemFulfillment} />
                        </div>
                        <p className="text-xs text-gray-400">
                          {itemMaterial && <>Vật liệu: {itemMaterial} · </>}
                          SL: {itemQty}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                        {formatPrice(itemPrice * itemQty)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <OrderFeedbackSection
            orderItems={orderItems}
            orderStatus={orderStatus}
            shipmentStatus={shipmentStatus}
            completedAt={order.completedAt}
            onRefresh={reloadOrder}
          />

          {/* Order Lifecycle Tracking */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Theo dõi đơn hàng</h2>
            </div>
            {isCod && !isInvoicePaid && (
              <div className="flex items-start gap-3 p-3 mb-4 bg-sky-50 rounded-xl border border-sky-200 text-sm text-sky-800">
                <ExclamationIcon />
                <p>
                  Đơn <strong>COD</strong> — bạn thanh toán tiền mặt khi nhận hàng.
                  Trạng thái &quot;Đã thanh toán&quot; chỉ hiện sau khi giao hàng thành công.
                </p>
              </div>
            )}
            <div className="space-y-0">
              {trackingSteps.map((step, idx) => {
                const stepComplete = step.done && !step.isCurrent;
                return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.isFailed
                        ? 'bg-red-500 text-white'
                        : step.isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                          : stepComplete
                            ? step.isPreOrder ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-300'
                    }`}>
                      {step.isFailed ? <XCircleIcon /> : stepComplete ? <CheckCircleSolidIcon /> : step.isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                      )}
                    </div>
                    {idx < trackingSteps.length - 1 && (
                      <div className={`w-0.5 h-12 ${stepComplete ? (step.isPreOrder ? 'bg-amber-200' : 'bg-indigo-200') : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${
                        step.isCurrent ? 'text-indigo-700' : stepComplete || step.done ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.isPreOrder && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          <ClockIcon />
                          Pre-Order
                        </span>
                      )}
                      {step.isCurrent && (
                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${step.isCurrent || stepComplete ? 'text-gray-500' : 'text-gray-400'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );})}
            </div>
          </div>

          {/* Shipment Info */}
          {shipment && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">Thông tin vận chuyển</h2>
                </div>
                {shipment.shippedDate && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    Đã xuất kho
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mã vận đơn (Tracking)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        {shipment.trackingNumber || 'Đang cập nhật...'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Đơn vị vận chuyển</p>
                    <p className="text-sm font-semibold text-gray-700">{shipment.carrierName || 'Giao hàng nhanh'}</p>
                  </div>
                </div>

                <div className="space-y-4 border-l border-gray-50 pl-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ngày gửi hàng</p>
                      <p className="text-sm text-gray-700">{formatDate(shipment.shippedDate) || 'Chưa gửi'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ngày nhận (Dự kiến)</p>
                      <p className="text-sm text-gray-700 font-bold text-indigo-600">{formatDate(shipment.deliveredDate) || 'Đang cập nhật'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {shipment.shippedDate && (
                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-4.446-3.51-8.05-8.055-8.05h-1.49m9.545 15.303a9.93 9.93 0 0 1-4.5 1.203m4.5-1.203a9.93 9.93 0 0 0-4.5-1.203m-4.5 1.203a9.93 9.93 0 0 1-4.5-1.203m4.5 1.203a9.93 9.93 0 0 0-4.5-1.203m-4.5 1.203V4.125c0-.621.504-1.125 1.125-1.125h9.495" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Bưu kiện đang trên đường giao!</p>
                    <p className="text-[10px] text-gray-500">Vui lòng để ý điện thoại từ shipper.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-5">
            {/* Price breakdown */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Tóm tắt đơn hàng</h3>
              <div className="space-y-2 text-sm">
                {subTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tạm tính</span>
                    <span className="text-gray-700">{formatPrice(subTotal)}</span>
                  </div>
                )}
                {shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phí vận chuyển</span>
                    <span className="text-gray-700">{formatPrice(shippingFee)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Thuế VAT</span>
                    <span className="text-gray-700">{formatPrice(taxAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-indigo-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {shippingAddress && (shippingAddress.receiverName || shippingAddress.name || shippingAddress.fullAddress) && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPinIcon />
                  <h3 className="font-bold text-gray-900 text-sm">Địa chỉ giao hàng</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {(shippingAddress.receiverName || shippingAddress.name) && (
                    <p className="font-medium text-gray-800">{shippingAddress.receiverName || shippingAddress.name}</p>
                  )}
                  {shippingAddress.fullAddress ? (
                    <p>{shippingAddress.fullAddress}</p>
                  ) : (
                    <>
                      <p>{[shippingAddress.addressLine, shippingAddress.address].filter(Boolean).join('')}</p>
                      <p>
                        {[shippingAddress.ward, shippingAddress.district, shippingAddress.city, shippingAddress.province]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </>
                  )}
                  {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                </div>
              </div>
            )}

            {/* Transaction / Payment info */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                <h3 className="font-bold text-gray-900 text-sm">Thanh toán</h3>
              </div>
              {transaction || invoice ? (
                <div className="space-y-2 text-sm">
                  {(txMethod || invoice) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phương thức</span>
                      <span className="font-medium text-gray-800">
                        {isCod ? 'Tiền mặt (COD)'
                          : txMethod.toUpperCase() === 'PAYOS' ? 'Thanh toán online'
                          : txMethod.toUpperCase() === 'VNPAY' ? 'VNPay'
                          : txMethod.toUpperCase() === 'CASH' ? 'Tiền mặt (COD)'
                          : txMethod || '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trạng thái</span>
                    <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${
                      isInvoicePaid || txStatus === 'PAID' || txStatus === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700'
                        : isCod
                        ? 'bg-sky-50 text-sky-700'
                        : txStatus === 'PENDING' || (invoice && !isInvoicePaid)
                        ? 'bg-amber-50 text-amber-700'
                        : txStatus === 'CANCELLED' || txStatus === 'FAILED'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isInvoicePaid || txStatus === 'PAID' || txStatus === 'SUCCESS' ? 'Đã thanh toán'
                        : isCod ? 'COD · thu khi giao'
                        : txStatus === 'PENDING' || (invoice && !isInvoicePaid) ? 'Chờ thanh toán'
                        : txStatus === 'CANCELLED' ? 'Đã hủy'
                        : txStatus === 'FAILED' ? 'Thất bại'
                        : invoice?.paymentStatus || '—'}
                    </span>
                  </div>
                  {txAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Số tiền</span>
                      <span className="font-medium text-gray-800">{formatPrice(txAmount)}</span>
                    </div>
                  )}
                  {isCustomMf2Order && customDepositAmount > 0 && !isInvoicePaid && !isPartiallyPaid && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cọc 30% (dự kiến)</span>
                      <span className="font-medium text-indigo-700">{formatPrice(customDepositAmount)}</span>
                    </div>
                  )}
                  {isPartiallyPaid && remainingBalance != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Còn lại</span>
                      <span className="font-medium text-amber-700">{formatPrice(remainingBalance)}</span>
                    </div>
                  )}
                  {transaction?.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thanh toán lúc</span>
                      <span className="text-gray-700 text-xs">{formatDate(transaction.paidAt)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Chưa có thông tin thanh toán</p>
              )}
            </div>

            {/* Source type */}
            {sourceType && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Loại đơn hàng</p>
                <ItemSourceBadge sourceType={sourceType} />
              </div>
            )}

            {/* Created date */}
            {createdDate && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Ngày tạo đơn</p>
                <p className="font-semibold text-gray-900 text-sm">{formatDate(createdDate)}</p>
              </div>
            )}

            {/* Thanh toán ngay — chỉ hiện khi chưa thanh toán */}
            {chatPath && (
              <div className="pt-4 border-t border-gray-100">
                <Link
                  to={chatPath}
                  className="block w-full py-2.5 text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  ← Quay lại chat đơn custom
                </Link>
              </div>
            )}
            {!isInvoicePaid && !isCod && (orderStatus.toUpperCase() === 'PENDING' || (isPartiallyPaid && isCustomMf2Order)) && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => handlePayNow('VNPAY')}
                  disabled={payingNow}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {payingNow ? 'Đang xử lý...' : isPartiallyPaid ? 'Thanh toán phần còn lại (VNPay)' : isDirectPrintOnlyOrder ? 'Thanh toán toàn bộ (VNPay)' : isCustomMf2Order ? 'Đặt cọc qua VNPay' : 'Thanh toán qua VNPay'}
                </button>
                {(!isCustomMf2Order || isDirectPrintOnlyOrder) && (
                <button
                  onClick={() => handlePayNow('CASH')}
                  disabled={payingNow}
                  className="w-full py-3 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thanh toán tiền mặt (COD)
                </button>
                )}
                {isPartiallyPaid && isCustomMf2Order && (
                <button
                  onClick={() => handlePayNow('CASH')}
                  disabled={payingNow}
                  className="w-full py-3 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận trả phần còn lại khi nhận hàng (COD)
                </button>
                )}
                {canCancelOrder && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling || payingNow}
                    className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-semibold text-sm border border-red-200 hover:bg-red-100 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
