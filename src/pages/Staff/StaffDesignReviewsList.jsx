import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PaintBrushIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

// Mock data based on Design_Work table
const mockDesignWorks = [
  {
    id: "DW-001",
    sourceType: "CUSTOMER_REQUEST",
    templateId: null,
    orderItemId: "ITEM-001",
    customerId: "CUST-001",
    customerName: "Nguyễn Văn A",
    assignedStaffId: "STAFF-001",
    staffName: "Nguyễn Designer",
    status: "IN_PROGRESS",
    createdAt: "2026-01-15 08:30",
    title: "Custom Figure Anime",
    lastMessage: "Đã cập nhật bản v2 theo yêu cầu",
    lastMessageTime: "10 mins ago",
    priority: "HIGH"
  },
  {
    id: "DW-002",
    sourceType: "TEMPLATE_CUSTOMIZATION",
    templateId: "TMP-005",
    orderItemId: "ITEM-005",
    customerId: "CUST-002",
    customerName: "Trần Thị B",
    assignedStaffId: null,
    staffName: "Unassigned",
    status: "QUEUED",
    createdAt: "2026-01-16 14:20",
    title: "Móc khóa khắc tên",
    lastMessage: "Yêu cầu mới từ khách hàng",
    lastMessageTime: "2 hours ago",
    priority: "NORMAL"
  },
  {
    id: "DW-003",
    sourceType: "CUSTOMER_REQUEST",
    templateId: null,
    orderItemId: "ITEM-008",
    customerId: "CUST-003",
    customerName: "Lê Văn C",
    assignedStaffId: "STAFF-001",
    staffName: "Nguyễn Designer",
    status: "REVIEWING",
    createdAt: "2026-01-14 09:00",
    title: "Tượng chân dung",
    lastMessage: "Khách đang xem bản preview v3",
    lastMessageTime: "1 day ago",
    priority: "NORMAL"
  },
  {
    id: "DW-004",
    sourceType: "AI_GENERATED",
    templateId: null,
    orderItemId: "ITEM-012",
    customerId: "CUST-004",
    customerName: "Phạm Minh D",
    assignedStaffId: "STAFF-002",
    staffName: "Trần 3D",
    status: "COMPLETED",
    createdAt: "2026-01-10 11:15",
    title: "Vỏ ốp điện thoại Dragon",
    lastMessage: "Đã chốt file in",
    lastMessageTime: "3 days ago",
    priority: "LOW"
  }
];

const statusConfig = {
  QUEUED: { label: "Hàng chờ", color: "bg-gray-100 text-gray-700", icon: <ClockIcon className="w-4 h-4" /> },
  ASSIGNED: { label: "Đã nhận", color: "bg-blue-100 text-blue-700", icon: <UserIcon className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Đang thiết kế", color: "bg-purple-100 text-purple-700", icon: <PaintBrushIcon className="w-4 h-4" /> },
  REVIEWING: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700", icon: <ChatBubbleLeftRightIcon className="w-4 h-4" /> },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: <CheckCircleIcon className="w-4 h-4" /> },
};

const StaffDesignReviewsList = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorks = mockDesignWorks.filter(work => {
    const matchesStatus = filterStatus === "all" || work.status === filterStatus;
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: mockDesignWorks.length,
    queued: mockDesignWorks.filter(w => w.status === "QUEUED").length,
    inProgress: mockDesignWorks.filter(w => w.status === "IN_PROGRESS").length,
    reviewing: mockDesignWorks.filter(w => w.status === "REVIEWING").length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎨 Quản lý thiết kế (Design Review)</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tiến độ thiết kế và trao đổi với khách hàng</p>
        </div>
        <Link
          to="/staff/dashboard"
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Tổng task</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
              <PaintBrushIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Chưa nhận (Queued)</p>
              <p className="text-2xl font-bold text-gray-700">{stats.queued}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Đang thiết kế</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <PaintBrushIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Chờ khách duyệt</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.reviewing}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên task, khách hàng..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {Object.keys(statusConfig).concat(['all']).map(status => (
            status === 'all' ? (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Tất cả
              </button>
            ) : (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${filterStatus === status ? statusConfig[status].color.replace('bg-', 'bg-opacity-100 bg-').replace('text-', 'text-white bg-') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {statusConfig[status].label}
              </button>
            )
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Design Work</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Staff phụ trách</th>
              <th className="px-6 py-4">Cập nhật cuối</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredWorks.length > 0 ? (
              filteredWorks.map(work => (
                <tr key={work.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{work.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{work.id} • Item: {work.orderItemId}</p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {work.sourceType.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {work.customerName.charAt(0)}
                      </div>
                      <span className="text-gray-700 text-sm font-medium">{work.customerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {work.assignedStaffId ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">
                          {work.staffName.charAt(0)}
                        </div>
                        <span className="text-gray-600 text-sm">{work.staffName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">Chưa assign</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">{work.lastMessageTime}</p>
                      <p className="text-gray-700 text-sm truncate max-w-[200px]">"{work.lastMessage}"</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[work.status]?.color}`}>
                      {statusConfig[work.status]?.icon}
                      {statusConfig[work.status]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/staff/design-reviews/${work.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p>Không tìm thấy task thiết kế nào</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          💡 <strong>Quy trình thiết kế:</strong> Nhận task (Assign) → Thiết kế (In Progress) → Gửi khách xem (Reviewing) → Khách chốt (Completed) → Chuyển sang In ấn.
        </p>
      </div>
    </div>
  );
};

export default StaffDesignReviewsList;
