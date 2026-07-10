import React, { useState } from 'react';
import { Table, Input, Tag, Space, Button, Card, DatePicker } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;

const ManagerTransactions = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  
  // Mock data based on schema
  const transactions = [
    {
      id: 'TRX-001',
      invoiceId: 'INV-001',
      amount: 580000,
      paymentMethod: 'credit_card',
      externalTransactionId: 'STRIPE_CH_123456',
      note: 'Thanh toán đơn hàng #ORD-2024-001',
      transactionStatus: 'success',
      createdAt: '2024-02-01 10:35:00'
    },
    {
      id: 'TRX-002',
      invoiceId: 'INV-004',
      amount: 855000,
      paymentMethod: 'bank_transfer',
      externalTransactionId: 'VCB_987654321',
      note: 'Chuyển khoản VCB',
      transactionStatus: 'success',
      createdAt: '2024-02-02 11:30:00'
    },
    {
      id: 'TRX-003',
      invoiceId: 'INV-005',
      amount: 520000,
      paymentMethod: 'momo',
      externalTransactionId: 'MOMO_11223344',
      note: 'Thanh toán qua ví MoMo',
      transactionStatus: 'success',
      createdAt: '2024-02-03 16:50:00'
    },
    {
      id: 'TRX-004',
      invoiceId: 'INV-002',
      amount: 1320000,
      paymentMethod: 'credit_card',
      externalTransactionId: 'STRIPE_CH_789012',
      note: 'Giao dịch thất bại do thẻ hết hạn',
      transactionStatus: 'failed',
      createdAt: '2024-02-05 14:20:00'
    },
  ];

  // Filter data
  const filteredData = transactions.filter(item => 
    item.id.toLowerCase().includes(searchText.toLowerCase()) ||
    item.invoiceId.toLowerCase().includes(searchText.toLowerCase()) ||
    item.externalTransactionId.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Mã Giao Dịch',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-medium text-indigo-600">{text}</span>
    },
    {
      title: 'Mã Hóa Đơn',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
    },
    {
      title: 'Số Tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} đ`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Phương Thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        switch(method) {
          case 'credit_card': return 'Thẻ Tín Dụng';
          case 'bank_transfer': return 'Chuyển Khoản';
          case 'momo': return 'Ví MoMo';
          case 'cash': return 'Tiền Mặt';
          default: return method;
        }
      }
    },
    {
      title: 'Mã Tham Chiếu',
      dataIndex: 'externalTransactionId',
      key: 'externalTransactionId',
      responsive: ['lg'],
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'transactionStatus',
      key: 'transactionStatus',
      render: (status) => {
        let color = 'default';
        let text = status;
        switch(status) {
          case 'success': color = 'success'; text = 'Thành công'; break;
          case 'pending': color = 'warning'; text = 'Đang xử lý'; break;
          case 'failed': color = 'error'; text = 'Thất bại'; break;
          case 'refunded': color = 'purple'; text = 'Đã hoàn tiền'; break;
          default: break;
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Thời Gian',
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
            onClick={() => navigate(`/manager/transactions/${record.id}`)}
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Giao Dịch</h1>
        <Space>
          <RangePicker />
          <Button type="primary">Xuất Excel</Button>
        </Space>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input 
            prefix={<SearchOutlined />} 
            placeholder="Tìm theo mã giao dịch, hóa đơn..." 
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

export default ManagerTransactions;
