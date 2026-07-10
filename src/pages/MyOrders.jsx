import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Spin } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { queryOrdersApi } from '../api/orderApi';

// SVG Icons
const PackageIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const ClipboardListIcon = ({ className = "w-12 h-12" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

// ─── ORDER STATUS CONFIG
const ORDER_STATUS_CONFIG = {
  CREATED: { label: 'Chờ thanh toán', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  PAID: { label: 'Đã thanh toán', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  PROCESSING: { label: 'Đang xử lý', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  SHIPPING: { label: 'Đang vận chuyển', className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  FAILED: { label: 'Thất bại', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
};

// ─── SOURCE TYPE CONFIG
const SOURCE_TYPE_CONFIG = {
  IN_STOCK: { label: 'Sẵn hàng', badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <PackageIcon className="w-3 h-3" /> },
  PRE_ORDER: { label: 'Pre-Order', badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: <PackageIcon className="w-3 h-3" /> },
  DESIGN_SERVICE: { label: 'Thiết kế', badgeClass: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', icon: <SparklesIcon className="w-3 h-3" /> },
  PRINT_SERVICE: { label: 'In 3D', badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', icon: <PackageIcon className="w-3 h-3" /> },
};

const StatusBadge = ({ status }) => {
  const s = (status || '').toUpperCase();
  const config = ORDER_STATUS_CONFIG[s] || { label: status || '—', className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const SourceTypeBadge = ({ sourceType }) => {
  const s = (sourceType || '').toUpperCase();
  const config = SOURCE_TYPE_CONFIG[s] || SOURCE_TYPE_CONFIG.IN_STOCK;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ─── FILTER TABS — filter bằng API query status
const FILTER_TABS = [
  { value: 'all', label: 'Tất cả', status: null },
  { value: 'created', label: 'Chờ thanh toán', status: 'CREATED' },
  { value: 'confirmed', label: 'Đã xác nhận', status: 'CONFIRMED' },
  { value: 'processing', label: 'Đang xử lý', status: 'PROCESSING' },
  { value: 'shipping', label: 'Đang vận chuyển', status: 'SHIPPING' },
  { value: 'completed', label: 'Hoàn thành', status: 'COMPLETED' },
  { value: 'cancelled', label: 'Đã hủy', status: 'CANCELLED' },
];

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  } catch {
    return '—';
  }
};

const formatPrice = (price) => {
  if (price == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const MyOrders = () => {
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

  const fetchOrders = useCallback(async (statusFilter, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        search: null,
        status: statusFilter || null,
        priority: null,
        sortDescending: true,
        sortBy: 'created',
        paging: {
          pageNumber: page,
          pageSize: 10,
        },
      };

      const response = await queryOrdersApi(payload);
      console.log('Orders query response:', response);

      const data = response?.data || response;

      // Response có thể là { items: [...], totalCount, pageNumber, ... } hoặc array trực tiếp
      if (Array.isArray(data)) {
        setOrders(data);
        setPagination({ pageNumber: 1, pageSize: 10, totalCount: data.length, totalPages: 1 });
      } else {
        const items = data?.items || data?.data || [];
        setOrders(Array.isArray(items) ? items : []);
        setPagination({
          pageNumber: data?.pageNumber || data?.paging?.pageNumber || page,
          pageSize: data?.pageSize || data?.paging?.pageSize || 10,
          totalCount: data?.totalCount || data?.total || items.length,
          totalPages: data?.totalPages || Math.ceil((data?.totalCount || items.length) / 10),
        });
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err?.response?.data?.message || err?.response?.data?.title || 'Không thể tải danh sách đơn hàng.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch khi filter thay đổi
  useEffect(() => {
    const activeTab = FILTER_TABS.find(t => t.value === filter);
    fetchOrders(activeTab?.status, 1);
  }, [filter, fetchOrders]);

  const handleFilterChange = (value) => {
    setFilter(value);
  };

  const handlePageChange = (page) => {
    const activeTab = FILTER_TABS.find(t => t.value === filter);
    fetchOrders(activeTab?.status, page);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        <p className="text-gray-500 mt-1">Theo dõi và quản lý tất cả đơn hàng</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {FILTER_TABS.map(f => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              filter === f.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Spin size="large" />
            <p className="text-gray-500 text-sm mt-2">Đang tải đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => {
                const activeTab = FILTER_TABS.find(t => t.value === filter);
                fetchOrders(activeTab?.status, 1);
              }}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="text-gray-300">
              <ClipboardListIcon />
            </div>
            <p className="text-gray-500 font-medium">Không có đơn hàng nào</p>
            <Link
              to="/products"
              className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              Khám phá sản phẩm
              <ArrowRightIcon />
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã đơn hàng</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày đặt</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng tiền</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => {
                  const orderId = order.id || order.orderId;
                  const orderCode = order.code || order.orderCode || orderId;
                  const orderDate = order.createdAt || order.created || order.date;
                  const orderStatus = order.status || order.orderStatus || 'CREATED';
                  const orderTotal = order.totalPrice ?? order.totalAmount ?? order.total ?? 0;
                  const orderSourceType = order.sourceType || 'IN_STOCK';

                  return (
                    <tr key={orderId} className="hover:bg-gray-50/70 transition-colors duration-100">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-semibold text-gray-800">{orderCode}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600" title={orderDate ? new Date(orderDate).toLocaleString('vi-VN') : undefined}>
                        {formatRelativeDate(orderDate)}
                      </td>
                      <td className="px-6 py-4"><SourceTypeBadge sourceType={orderSourceType} /></td>
                      <td className="px-6 py-4"><StatusBadge status={orderStatus} /></td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatPrice(orderTotal)}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/orders/${orderId}`}
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-150 cursor-pointer"
                        >
                          Xem chi tiết
                          <ArrowRightIcon />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Trang {pagination.pageNumber} / {pagination.totalPages} · Tổng {pagination.totalCount} đơn hàng
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(pagination.pageNumber - 1)}
                    disabled={pagination.pageNumber <= 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeftIcon />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(pagination.pageNumber - 2, pagination.totalPages - 4));
                    const page = start + i;
                    if (page > pagination.totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          page === pagination.pageNumber
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.pageNumber + 1)}
                    disabled={pagination.pageNumber >= pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
