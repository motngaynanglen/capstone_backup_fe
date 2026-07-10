import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

// Mock data based on DB schema
const mockOrderDetail = {
  // Order table
  id: "ORD001",
  customerId: "CUST-001",
  staffId: "STAFF-001",
  totalPrice: 580000,
  orderStatus: "PROCESSING",
  priority: 2,
  createdAt: "2026-01-10 09:30",

  // Customer + Account (joined)
  customer: {
    id: "CUST-001",
    fullname: "Nguyễn Văn A",
    email: "a.nguyen@email.com",
    contactPhone: "0901234567",
    profileImageUrl: null,
  },

  // ShippingAddress
  shippingAddress: {
    receiverName: "Nguyễn Văn A",
    phone: "0901234567",
    addressLine: "123 Nguyễn Trãi",
    ward: "Phường 1",
    district: "Quận 1",
    city: "TP.HCM",
    isDefault: true,
  },

  // OrderItems
  items: [
    {
      id: "ITEM-001",
      sourceType: "DESIGN_WORK",
      designVariantId: null,
      quantityOrdered: 2,
      unitPrice: 150000,
      totalPrice: 300000,
      fulfillmentStatus: "DESIGNING",
      // Design_Work
      designWork: {
        id: "DW-001",
        status: "IN_PROGRESS",
        assignedStaffId: "STAFF-001",
      },
      // Design_Version_History
      designVersions: [
        { versionNumber: 1, fileUrl: "/designs/figure_v1.stl", status: "REJECTED", createdAt: "2026-01-11 10:00" },
        { versionNumber: 2, fileUrl: "/designs/figure_v2.stl", status: "PENDING", createdAt: "2026-01-12 14:00" },
      ],
      customerRequest: "Custom Figure anime chibi, cao 10cm",
      // Material
      material: { name: "PLA", color: "Red" },
    },
    {
      id: "ITEM-002",
      sourceType: "CUSTOMER_FILE",
      designVariantId: null,
      quantityOrdered: 1,
      unitPrice: 120000,
      totalPrice: 120000,
      fulfillmentStatus: "WAITING_REVIEW",
      customerFile: {
        fileName: "phone_case.stl",
        fileUrl: "/uploads/phone_case.stl",
        fileSize: "1.8 MB",
      },
      material: { name: "PETG", color: "Blue" },
    },
    {
      id: "ITEM-003",
      sourceType: "PREMADE",
      designVariantId: "VAR-001",
      quantityOrdered: 2,
      unitPrice: 80000,
      totalPrice: 160000,
      fulfillmentStatus: "READY_TO_PRINT",
      designVariant: {
        code: "KEY-001",
        name: "Móc khóa logo",
        price: 80000,
      },
      material: { name: "PLA", color: "White" },
    },
  ],

  // Invoice
  invoice: {
    invoiceCode: "INV-2026-0001",
    subTotal: 580000,
    shippingFee: 30000,
    taxAmount: 0,
    totalAmount: 610000,
    paymentStatus: "UNPAID",
  },

  // ProductionJobs (nếu có)
  productionJobs: [
    {
      id: "JOB-001",
      orderItemId: "ITEM-003",
      materialId: "MAT-001",
      printStatus: "QUEUED",
      quantityToPrint: 2,
    },
  ],
};

const orderStatusConfig = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
  PRINTING: { label: "Đang in", color: "bg-orange-100 text-orange-800" },
  SHIPPED: { label: "Đã giao", color: "bg-indigo-100 text-indigo-800" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

const fulfillmentStatusConfig = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
  DESIGNING: { label: "Đang thiết kế", color: "bg-blue-100 text-blue-800", icon: "🎨" },
  WAITING_REVIEW: { label: "Chờ duyệt", color: "bg-purple-100 text-purple-800", icon: "👁️" },
  APPROVED: { label: "Đã duyệt", color: "bg-green-100 text-green-800", icon: "✅" },
  READY_TO_PRINT: { label: "Sẵn sàng in", color: "bg-indigo-100 text-indigo-800", icon: "📋" },
  PRINTING: { label: "Đang in", color: "bg-orange-100 text-orange-800", icon: "🖨️" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: "✓" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: "✗" },
};

const sourceTypeConfig = {
  PREMADE: { label: "Design_Variant", icon: "📦", color: "text-gray-600" },
  CUSTOMER_FILE: { label: "Customer File", icon: "📤", color: "text-blue-600" },
  DESIGN_WORK: { label: "Design_Work", icon: "✏️", color: "text-purple-600" },
};

const StaffCustomOrderManagementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(mockOrderDetail);
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);

  const handleUpdateOrderStatus = () => {
    setOrder(prev => ({ ...prev, orderStatus }));
    alert(`Order ${id} → OrderStatus: ${orderStatus}`);
  };

  const updateItemStatus = (itemId, newStatus) => {
    setOrder(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, fulfillmentStatus: newStatus } : item
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/staff/custom-orders-management"
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
            <p className="text-gray-500 text-sm">CreatedAt: {order.createdAt} • Priority: P{order.priority}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800"
          >
            {Object.keys(orderStatusConfig).map(status => (
              <option key={status} value={status}>{orderStatusConfig[status].label}</option>
            ))}
          </select>
          <button
            onClick={handleUpdateOrderStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            💾 Save Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Order Items */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">📦 OrderItems ({order.items.length})</h2>

          {order.items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              {/* Item Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {sourceTypeConfig[item.sourceType]?.icon}
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-semibold">
                      {item.designVariant?.name || item.customerFile?.fileName || `Design Work`}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-sm">
                      <span className={sourceTypeConfig[item.sourceType]?.color}>
                        {sourceTypeConfig[item.sourceType]?.label}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">Qty: {item.quantityOrdered}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{item.material?.name} - {item.material?.color}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-green-600 font-medium">{item.totalPrice.toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${fulfillmentStatusConfig[item.fulfillmentStatus]?.color}`}>
                  {fulfillmentStatusConfig[item.fulfillmentStatus]?.icon} {fulfillmentStatusConfig[item.fulfillmentStatus]?.label}
                </span>
              </div>

              {/* DESIGN_WORK Details */}
              {item.sourceType === "DESIGN_WORK" && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {item.customerRequest && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-purple-700 text-xs font-medium">💬 Customer Request</p>
                      <p className="text-gray-700 text-sm">{item.customerRequest}</p>
                    </div>
                  )}
                  {item.designVersions?.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-sm mb-2">📁 Design Versions:</p>
                      <div className="space-y-2">
                        {item.designVersions.map((v, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center font-bold text-xs">v{v.versionNumber}</span>
                              <span className="text-gray-700">{v.fileUrl}</span>
                              <span className="text-gray-400 text-xs">{v.createdAt}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs ${v.status === 'REJECTED' ? 'bg-red-100 text-red-700' : v.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {v.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CUSTOMER_FILE Details */}
              {item.sourceType === "CUSTOMER_FILE" && item.customerFile && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div>
                      <p className="text-blue-700 text-xs font-medium">📤 Customer File</p>
                      <p className="text-gray-800">{item.customerFile.fileName} ({item.customerFile.fileSize})</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">⬇️ Download</button>
                  </div>
                </div>
              )}

              {/* PREMADE Details */}
              {item.sourceType === "PREMADE" && item.designVariant && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Design_Variant</p>
                    <p className="text-gray-800 font-medium">{item.designVariant.code} - {item.designVariant.name}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                {item.fulfillmentStatus === "WAITING_REVIEW" && (
                  <>
                    <button onClick={() => updateItemStatus(item.id, "APPROVED")} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm">✅ Approve</button>
                    <button onClick={() => updateItemStatus(item.id, "REJECTED")} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm">❌ Reject</button>
                  </>
                )}
                {item.fulfillmentStatus === "APPROVED" && (
                  <button onClick={() => updateItemStatus(item.id, "READY_TO_PRINT")} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm">📋 Ready to Print</button>
                )}
                {item.fulfillmentStatus === "READY_TO_PRINT" && (
                  <button onClick={() => navigate(`/staff/production-jobs/new?itemId=${item.id}`)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm">🖨️ Create ProductionJob</button>
                )}
                {item.fulfillmentStatus === "PRINTING" && (
                  <button onClick={() => updateItemStatus(item.id, "COMPLETED")} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm">✓ Complete</button>
                )}
                <button className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm">👁️ Preview 3D</button>
              </div>
            </div>
          ))}

          {/* Production Jobs */}
          {order.productionJobs?.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-gray-800 font-semibold mb-4">🖨️ ProductionJobs</h3>
              <div className="space-y-2">
                {order.productionJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div>
                      <p className="text-gray-800 font-medium">{job.id}</p>
                      <p className="text-gray-500 text-sm">OrderItem: {job.orderItemId} • Qty: {job.quantityToPrint}</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">{job.printStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-gray-800 font-semibold mb-4">👤 Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {order.customer.fullname.charAt(0)}
              </div>
              <div>
                <p className="text-gray-800 font-medium">{order.customer.fullname}</p>
                <p className="text-gray-400 text-sm">{order.customer.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Contact_Phone</span>
                <span className="text-gray-800">{order.customer.contactPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-gray-800 font-semibold mb-4">📍 ShippingAddress</h3>
            <div className="text-sm space-y-1">
              <p className="text-gray-800 font-medium">{order.shippingAddress.receiverName}</p>
              <p className="text-gray-600">{order.shippingAddress.phone}</p>
              <p className="text-gray-600">
                {order.shippingAddress.addressLine}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
              </p>
            </div>
          </div>

          {/* Invoice */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-gray-800 font-semibold mb-4">💰 Invoice</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">InvoiceCode</span>
                <span className="font-mono text-gray-800">{order.invoice.invoiceCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SubTotal</span>
                <span>{order.invoice.subTotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ShippingFee</span>
                <span>{order.invoice.shippingFee.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-semibold">TotalAmount</span>
                <span className="text-green-600 font-bold">{order.invoice.totalAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PaymentStatus</span>
                <span className={`px-2 py-0.5 rounded text-xs ${order.invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {order.invoice.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-gray-800 font-semibold mb-4">⚡ Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">💬 Contact Customer</button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">🖨️ Print Invoice</button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">📦 Create Shipment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffCustomOrderManagementDetail;
