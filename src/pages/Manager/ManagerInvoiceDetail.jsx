import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Table, Divider, Space } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';

const ManagerInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - In real app, fetch data by id
  const invoice = {
    id: id,
    orderId: 'ORD-2024-001',
    invoiceCode: 'INV-2024-001',
    subTotal: 500000,
    taxAmount: 50000,
    shippingFee: 30000,
    totalAmount: 580000,
    paymentStatus: 'paid',
    dueDate: '2024-02-15',
    createdAt: '2024-02-01 10:30:00',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    items: [
      { key: 1, name: 'Mô hình 3D Custom Logo', quantity: 1, price: 500000, total: 500000 }
    ]
  };

  const columns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: val => `${val.toLocaleString('vi-VN')} đ` },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: val => `${val.toLocaleString('vi-VN')} đ` },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
        <Space>
          <Button icon={<PrinterOutlined />}>In Hóa Đơn</Button>
          <Button icon={<DownloadOutlined />} type="primary">Tải PDF</Button>
        </Space>
      </div>

      <Card title={<span className="text-xl font-bold">Chi tiết Hóa Đơn #{invoice.invoiceCode}</span>} bordered={false}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã Đơn Hàng">
            <a onClick={() => navigate(`/manager/orders/${invoice.orderId}`)}>{invoice.orderId}</a>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{invoice.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Khách hàng">{invoice.customerName}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{invoice.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={invoice.paymentStatus === 'paid' ? 'success' : 'warning'}>
              {invoice.paymentStatus === 'paid' ? 'Đã thanh toán' : invoice.paymentStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Hạn thanh toán">{invoice.dueDate}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <h3 className="font-semibold mb-4">Chi tiết sản phẩm</h3>
        <Table columns={columns} dataSource={invoice.items} pagination={false} bordered />

        <div className="flex justify-end mt-6">
          <div className="w-64">
            <div className="flex justify-between mb-2">
              <span>Tạm tính:</span>
              <span>{invoice.subTotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Thuế (10%):</span>
              <span>{invoice.taxAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Phí vận chuyển:</span>
              <span>{invoice.shippingFee.toLocaleString('vi-VN')} đ</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between font-bold text-lg text-indigo-600">
              <span>Tổng cộng:</span>
              <span>{invoice.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ManagerInvoiceDetail;
