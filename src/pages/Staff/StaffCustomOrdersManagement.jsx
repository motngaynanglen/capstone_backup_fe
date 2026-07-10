import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// Mock data based on DB schema: Order, OrderItem, Customer, Account
const mockOrders = [
  {
    id: "ORD001",
    customerId: "CUST-001",
    customerName: "Nguyễn Văn A",
    customerPhone: "0901234567",
    staffId: "STAFF-001",
    totalPrice: 580000,
    orderStatus: "PROCESSING",
    priority: 2,
    createdAt: "2026-01-10 09:30",
    itemCount: 3,
    sourceTypes: ["DESIGN_WORK", "CUSTOMER_FILE", "PREMADE"],
  },
  {
    id: "ORD002",
    customerId: "CUST-002",
    customerName: "Trần Thị B",
    customerPhone: "0902345678",
    staffId: "STAFF-001",
    totalPrice: 320000,
    orderStatus: "PRINTING",
    priority: 3,
    createdAt: "2026-01-11 14:20",
    itemCount: 2,
    sourceTypes: ["PREMADE"],
  },
  {
    id: "ORD003",
    customerId: "CUST-003",
    customerName: "Lê Văn C",
    customerPhone: "0903456789",
    staffId: null,
    totalPrice: 450000,
    orderStatus: "PENDING",
    priority: 1,
    createdAt: "2026-01-12 08:15",
    itemCount: 1,
    sourceTypes: ["DESIGN_WORK"],
  },
  {
    id: "ORD004",
    customerId: "CUST-004",
    customerName: "Phạm Thị D",
    customerPhone: "0904567890",
    staffId: "STAFF-002",
    totalPrice: 890000,
    orderStatus: "COMPLETED",
    priority: 1,
    createdAt: "2026-01-08 16:45",
    itemCount: 4,
    sourceTypes: ["CUSTOMER_FILE", "PREMADE"],
  },
  {
    id: "ORD005",
    customerId: "CUST-005",
    customerName: "Hoàng Văn E",
    customerPhone: "0905678901",
    staffId: "STAFF-001",
    totalPrice: 150000,
    orderStatus: "SHIPPED",
    priority: 1,
    createdAt: "2026-01-07 10:00",
    itemCount: 1,
    sourceTypes: ["PREMADE"],
  },
];

const orderStatusConfig = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800", icon: "⚙️" },
  PRINTING: { label: "Đang in", color: "bg-orange-100 text-orange-800", icon: "🖨️" },
  SHIPPED: { label: "Đã giao", color: "bg-indigo-100 text-indigo-800", icon: "🚚" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: "✅" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: "❌" },
};

const sourceTypeConfig = {
  PREMADE: { label: "Có sẵn", icon: "📦", color: "bg-gray-100 text-gray-600" },
  CUSTOMER_FILE: { label: "File KH", icon: "📤", color: "bg-blue-100 text-blue-600" },
  DESIGN_WORK: { label: "Thiết kế", icon: "✏️", color: "bg-purple-100 text-purple-600" },
  AI_GENERATE: { label: "AI", icon: "🤖", color: "bg-green-100 text-green-600" },
};

const StaffCustomOrdersManagement = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredOrders = mockOrders.filter((order) => {
    const matchStatus = statusFilter === "All" || order.orderStatus === statusFilter;
    const matchSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.orderStatus === "PENDING").length,
    processing: mockOrders.filter(o => o.orderStatus === "PROCESSING").length,
    printing: mockOrders.filter(o => o.orderStatus === "PRINTING").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Quản lý đơn hàng Custom</h1>
          <p className="text-gray-500 text-sm mt-1">Tables: Order, OrderItem, Customer, Account</p>
        </div>
        <Link
          to="/staff/dashboard"
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng đơn</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">PENDING</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">PROCESSING</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">⚙️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">PRINTING</p>
              <p className="text-2xl font-bold text-orange-600">{stats.printing}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🖨️</div>
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
                placeholder="Tìm Order ID hoặc tên khách..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">OrderStatus:</span>
            <div className="flex gap-1">
              {["All", "PENDING", "PROCESSING", "PRINTING", "SHIPPED", "COMPLETED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {status === "All" ? "Tất cả" : orderStatusConfig[status]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SourceTypes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">TotalPrice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">OrderStatus</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">StaffId</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CreatedAt</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>Không tìm thấy đơn hàng</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-800">{order.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-800 font-medium">{order.customerName}</p>
                      <p className="text-gray-400 text-xs">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 text-sm font-medium">
                      {order.itemCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {order.sourceTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className={`px-1.5 py-0.5 rounded text-xs ${sourceTypeConfig[type]?.color}`}
                          title={sourceTypeConfig[type]?.label}
                        >
                          {sourceTypeConfig[type]?.icon}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-green-600 font-medium">{order.totalPrice.toLocaleString()}đ</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${order.priority === 3
                          ? "bg-red-100 text-red-700"
                          : order.priority === 2
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      P{order.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${orderStatusConfig[order.orderStatus]?.color
                        }`}
                    >
                      {orderStatusConfig[order.orderStatus]?.icon} {orderStatusConfig[order.orderStatus]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.staffId ? (
                      <span className="text-gray-600 text-xs font-mono">{order.staffId}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{order.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/staff/custom-orders-management/${order.id}`)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Chi tiết
                      </button>
                      <button className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-gray-500 text-sm">
          Hiển thị {filteredOrders.length} / {mockOrders.length} đơn hàng
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-400 rounded-lg" disabled>
            ← Trước
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
            Sau →
          </button>
        </div>
      </div>

      {/* DB Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          💡 <strong>DB Schema:</strong> Order (OrderStatus, Priority, TotalPrice, StaffId) → OrderItem (SourceType) → Customer → Account
        </p>
      </div>
    </div>
  );
};

export default StaffCustomOrdersManagement;
