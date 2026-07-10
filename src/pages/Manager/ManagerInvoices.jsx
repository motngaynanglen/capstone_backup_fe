import React, { useState } from 'react';
import { Table, Input, Tag, Space, Button, Card, DatePicker } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;

const ManagerInvoices = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  
  // Mock data based on schema
  const invoices = [
    {
      id: 'INV-001',
      orderId: 'ORD-2024-001',
      invoiceCode: 'INV-2024-001',
      subTotal: 500000,
      taxAmount: 50000,
      shippingFee: 30000,
      totalAmount: 580000,
      paymentStatus: 'paid',
      dueDate: '2024-02-15',
      createdAt: '2024-02-01 10:30:00'
    },
    {
      id: 'INV-002',
      orderId: 'ORD-2024-002',
      invoiceCode: 'INV-2024-002',
      subTotal: 1200000,
      taxAmount: 120000,
      shippingFee: 0,
      totalAmount: 1320000,
      paymentStatus: 'pending',
      dueDate: '2024-02-20',
      createdAt: '2024-02-05 14:15:00'
    },
    {
      id: 'INV-003',
      orderId: 'ORD-2024-003',
      invoiceCode: 'INV-2024-003',
      subTotal: 300000,
      taxAmount: 30000,
      shippingFee: 25000,
      totalAmount: 355000,
      paymentStatus: 'overdue',
      dueDate: '2024-01-30',
      createdAt: '2024-01-15 09:00:00'
    },
    {
      id: 'INV-004',
      orderId: 'ORD-2024-005',
      invoiceCode: 'INV-2024-004',
      subTotal: 750000,
      taxAmount: 75000,
      shippingFee: 30000,
      totalAmount: 855000,
      paymentStatus: 'paid',
      dueDate: '2024-02-10',
      createdAt: '2024-02-02 11:20:00'
    },
    {
      id: 'INV-005',
      orderId: 'ORD-2024-008',
      invoiceCode: 'INV-2024-005',
      subTotal: 450000,
      taxAmount: 45000,
      shippingFee: 25000,
      totalAmount: 520000,
      paymentStatus: 'paid',
      dueDate: '2024-02-12',
      createdAt: '2024-02-03 16:45:00'
    }
  ];

  // Filter data
  const filteredData = invoices.filter(item => 
    item.invoiceCode.toLowerCase().includes(searchText.toLowerCase()) ||
    item.orderId.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Mã Hóa Đơn',
      dataIndex: 'invoiceCode',
      key: 'invoiceCode',
      render: (text) => <span className="font-medium text-indigo-600">{text}</span>
    },
    {
      title: 'Mã Đơn Hàng',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} đ`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'default';
        let text = status;
        switch(status) {
          case 'paid': color = 'success'; text = 'Đã thanh toán'; break;
          case 'pending': color = 'warning'; text = 'Chờ thanh toán'; break;
          case 'overdue': color = 'error'; text = 'Quá hạn'; break;
          default: break;
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Hạn Thanh Toán',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => navigate(`/manager/invoices/${record.id}`)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Hóa Đơn</h1>
        <Space>
          <RangePicker />
          <Button type="primary">Xuất Excel</Button>
        </Space>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input 
            prefix={<SearchOutlined />} 
            placeholder="Tìm theo mã hóa đơn, mã đơn hàng..." 
            className="max-w-md"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
};

export default ManagerInvoices;
