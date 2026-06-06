import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { message, Spin, Modal } from 'antd';
import { getDesignRequests, assignStaffToRequest } from '../../api/mainflow2Api';

// Trạng thái thật từ BE (DesignWork.Status) — không còn dùng key giả SUBMITTED/QUOTED...
const STATUS_CONFIG = {
  SKETCHING: { label: 'Mới gửi / Phác thảo', color: 'bg-gray-100 text-gray-800', icon: '📥' },
  PENDING: { label: 'Chờ tiếp nhận', color: 'bg-amber-100 text-amber-800', icon: '⏳' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-800', icon: '👤' },
  REVIEWING: { label: 'Đang kiểm duyệt', color: 'bg-purple-100 text-purple-800', icon: '💰' },
  COMPLETED: { label: 'Đã nghiệm thu', color: 'bg-green-100 text-green-800', icon: '✅' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: '❌' },
};

// Trạng thái coi là "chưa tiếp nhận" → cho phép nhận việc.
const UNASSIGNED_STATUSES = ['SKETCHING', 'PENDING'];

const shortId = (id) => (id ? `${String(id).slice(0, 8)}…` : '—');

const StaffCustomOrdersList = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Sắp xếp theo thời gian tạo mới nhất lên đầu.
      const params = { pageNumber: 1, pageSize: 100, sortBy: 'Created', sortDescending: true };
      if (filter !== 'all') {
        params.status = filter;
      }
      const res = await getDesignRequests(params);
      if (res && res.statusCode === 200) {
        setRequests(res.data || []);
      } else {
        message.error(res?.message || 'Lỗi lấy danh sách yêu cầu');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi lấy danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (id) => {
    Modal.confirm({
      title: 'Tiếp nhận yêu cầu',
      content: 'Bạn sẽ phụ trách báo giá và trao đổi với khách hàng cho yêu cầu này?',
      okText: 'Nhận việc',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setAssigningId(id);
          const res = await assignStaffToRequest(id);
          if (res && res.statusCode === 200) {
            message.success('Đã tiếp nhận yêu cầu thiết kế!');
            fetchRequests(); // reload list
          } else {
            message.error(res?.message || 'Không thể tiếp nhận');
          }
        } catch (error) {
          message.error('Lỗi khi tiếp nhận yêu cầu!');
        } finally {
          setAssigningId(null);
        }
      }
    });
  };

  const filteredRequests = requests.filter(req => {
    if (searchTerm && !String(req.id || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(req.name || '').toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    total: requests.length,
    submitted: requests.filter(r => UNASSIGNED_STATUSES.includes(r.status)).length,
    assigned: requests.filter(r => r.status === 'IN_PROGRESS').length,
    quoted: requests.filter(r => r.status === 'REVIEWING').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cổng tiếp nhận Yêu cầu Thiết kế</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách yêu cầu thiết kế riêng từ khách hàng</p>
        </div>
        <Link
          to="/staff/dashboard"
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Hiển thị</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Chờ tiếp nhận</p>
              <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📥</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Đang phụ trách</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.assigned}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">👤</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Chờ khách duyệt</p>
              <p className="text-2xl font-bold text-purple-600">{stats.quoted}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Tìm theo ID, tiêu đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Trạng thái:</span>
            <div className="flex flex-wrap gap-1">
              {['all', 'SKETCHING', 'IN_PROGRESS', 'REVIEWING', 'COMPLETED', 'CANCELLED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {status === 'all' ? 'Tất cả' : STATUS_CONFIG[status]?.label || status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mã yêu cầu</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mức giá gần nhất</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <Spin size="large" />
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>Không tìm thấy yêu cầu thiết kế</p>
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-800" title={req.id}>{shortId(req.id)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 font-medium max-w-[220px] truncate" title={req.name}>{req.name || 'Không có tiêu đề'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const price = req.latestConfirmedQuotePrice ?? req.latestQuotedPrice;
                      return (
                        <span className="text-gray-800 font-medium">
                          {price != null ? `${Number(price).toLocaleString('vi-VN')} ₫` : 'Chưa báo giá'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(req.created).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[req.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_CONFIG[req.status]?.icon} {STATUS_CONFIG[req.status]?.label || req.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {UNASSIGNED_STATUSES.includes(req.status) ? (
                        <button
                          onClick={() => handleAssign(req.id)}
                          disabled={assigningId === req.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                        >
                          {assigningId === req.id ? 'Đang nhận...' : 'Nhận việc'}
                        </button>
                      ) : null}
                      
                      {/* For assigning or interacting, go to Detail page */}
                      <Link
                        to={`/staff/custom-orders/${req.id}`}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffCustomOrdersList;
