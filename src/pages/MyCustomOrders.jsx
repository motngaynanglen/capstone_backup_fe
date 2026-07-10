import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { message, Spin } from 'antd';
import { getDesignRequests } from '../api/mainflow2Api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'SUBMITTED', label: 'Mới tạo' },
  { value: 'ASSIGNED', label: 'Đã tiếp nhận' },
  { value: 'QUOTED', label: 'Đã báo giá' },
  { value: 'NEGOTIATING', label: 'Đang thương lượng' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'CANCELLED', label: 'Đã hủy' }
];

const MyCustomOrders = () => {
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  const fetchOrders = async (statusFilter) => {
    setLoading(true);
    try {
      const params = { pageNumber: 1, pageSize: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await getDesignRequests(params);
      if (res && res.statusCode === 200) {
        setOrders(res.data || []);
      } else {
        message.error(res?.message || 'Có lỗi khi lấy danh sách yêu cầu');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải danh sách yêu cầu!');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Yêu cầu thiết kế của tôi</h1>
        <Link
          to="/custom-order"
          className="py-2 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Tạo đơn Custom mới
        </Link>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === opt.value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">Không tìm thấy yêu cầu thiết kế nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Mã đơn</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Tiêu đề</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Ngày đặt</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Báo giá (VND)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    <span title={order.id}>{order.id.split('-')[0]}...</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.created).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    {order.latestQuotedPrice != null ? `$${order.latestQuotedPrice.toLocaleString()}` : 'Chưa có'}
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
        )}
      </div>
    </div>
  );
};

export default MyCustomOrders;

