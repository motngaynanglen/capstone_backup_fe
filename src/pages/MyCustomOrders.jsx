import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { message, Spin } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getDesignRequests } from '../api/mainflow2Api';

const PAGE_SIZE = 10;

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

const SparklesIcon = ({ className = 'w-3 h-3' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const PrinterIcon = ({ className = 'w-3 h-3' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.22H7.231c-.662 0-1.18-.568-1.12-1.22L6.34 18m11.318 0h1.921M6.34 18H4.5m0 0a2.25 2.25 0 0 1-.45-4.458A48.567 48.567 0 0 1 12 13.5c2.676 0 5.216.584 7.45 1.634a2.25 2.25 0 0 1-.45 4.458H4.5Z" />
  </svg>
);

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'SUBMITTED', label: 'Mới tạo' },
  { value: 'ASSIGNED', label: 'Đã tiếp nhận' },
  { value: 'QUOTED', label: 'Đã báo giá' },
  { value: 'NEGOTIATING', label: 'Đang thương lượng' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const TYPE_TABS = [
  { value: 'all', label: 'Tất cả loại', category: null },
  { value: 'design', label: 'Đơn thiết kế', category: 'design' },
  { value: 'print', label: 'Đơn in', category: 'print' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', sortBy: 'created', sortDescending: true },
  { value: 'oldest', label: 'Cũ nhất', sortBy: 'created', sortDescending: false },
  { value: 'price_high', label: 'Giá cao → thấp', sortBy: 'price', sortDescending: true },
  { value: 'price_low', label: 'Giá thấp → cao', sortBy: 'price', sortDescending: false },
];

const SOURCE_TYPE_CONFIG = {
  CUSTOM_QUOTE_MF2: {
    label: 'Thiết kế',
    badgeClass: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    icon: <SparklesIcon />,
  },
  CUSTOM_FILE_PRINT_MF2: {
    label: 'In file',
    badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    icon: <PrinterIcon />,
  },
  AI_GENERATED: {
    label: 'In AI',
    badgeClass: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
    icon: <SparklesIcon />,
  },
  PRINT_FROM_DESIGN_MF2: {
    label: 'In từ TK',
    badgeClass: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    icon: <PrinterIcon />,
  },
  REPRINT_MF2: {
    label: 'In lại',
    badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    icon: <PrinterIcon />,
  },
};

const SourceTypeBadge = ({ sourceType }) => {
  const key = (sourceType || '').toUpperCase();
  const config = SOURCE_TYPE_CONFIG[key] || {
    label: sourceType || 'Custom',
    badgeClass: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    icon: null,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const formatPrice = (price) => {
  if (price == null) return 'Chưa có';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  } catch {
    return '—';
  }
};

const MyCustomOrders = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: PAGE_SIZE, totalCount: 0, totalPages: 0 });

  const fetchOrders = useCallback(async ({ status, category, sortBy, sortDescending, page = 1 }) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDescending,
      };
      if (status && status !== 'all') {
        params.status = status;
      }
      if (category) {
        params.category = category;
      }
      const res = await getDesignRequests(params);
      if (res && res.statusCode === 200) {
        const items = Array.isArray(res.data) ? res.data : [];
        const paging = res.additionalData?.paging || {};
        setOrders(items);
        setPagination({
          pageNumber: paging.pageNumber || page,
          pageSize: paging.pageSize || PAGE_SIZE,
          totalCount: paging.totalCount ?? items.length,
          totalPages: paging.totalPages || Math.ceil((paging.totalCount ?? items.length) / PAGE_SIZE) || 1,
        });
      } else {
        message.error(res?.message || 'Có lỗi khi lấy danh sách yêu cầu');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải danh sách yêu cầu!');
    } finally {
      setLoading(false);
    }
  }, []);

  const buildFetchParams = useCallback((page = 1) => {
    const activeType = TYPE_TABS.find(t => t.value === typeFilter);
    const activeSort = SORT_OPTIONS.find(s => s.value === sortKey) || SORT_OPTIONS[0];
    return {
      status: statusFilter,
      category: activeType?.category || null,
      sortBy: activeSort.sortBy,
      sortDescending: activeSort.sortDescending,
      page,
    };
  }, [statusFilter, typeFilter, sortKey]);

  useEffect(() => {
    fetchOrders(buildFetchParams(1));
  }, [statusFilter, typeFilter, sortKey, fetchOrders, buildFetchParams]);

  const handlePageChange = (page) => {
    fetchOrders(buildFetchParams(page));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-gray-100 text-gray-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'QUOTED': return 'bg-purple-100 text-purple-800';
      case 'NEGOTIATING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find(opt => opt.value === status);
    return found ? found.label : status;
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Đơn Custom của tôi</h1>
          <p className="text-gray-500 mt-1">Theo dõi yêu cầu thiết kế và đơn in 3D</p>
        </div>
        <Link
          to="/custom-order"
          className="py-2 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Tạo đơn Custom mới
        </Link>
      </div>

      {/* Loại đơn: thiết kế / in */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeFilter(tab.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              typeFilter === tab.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {tab.value === 'design' && <SparklesIcon className="w-3.5 h-3.5" />}
            {tab.value === 'print' && <PrinterIcon className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trạng thái + Sắp xếp */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="custom-order-sort" className="text-sm text-gray-500 whitespace-nowrap">
            Sắp xếp:
          </label>
          <select
            id="custom-order-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">Không tìm thấy yêu cầu nào</p>
            <p className="text-gray-400 text-sm mt-2">Thử đổi bộ lọc loại đơn hoặc trạng thái</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Mã đơn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Tiêu đề</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Ngày đặt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Báo giá</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      <span title={order.id}>{order.id.split('-')[0]}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <SourceTypeBadge sourceType={order.sourceType} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.title}</td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      title={order.created ? new Date(order.created).toLocaleString('vi-VN') : undefined}
                    >
                      {formatRelativeDate(order.created)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {formatPrice(order.latestQuotedPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/custom-orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Trang {pagination.pageNumber} / {pagination.totalPages} · Tổng {pagination.totalCount} yêu cầu
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
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
                        type="button"
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
                    type="button"
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

export default MyCustomOrders;
