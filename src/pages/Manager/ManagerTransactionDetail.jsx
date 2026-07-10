import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const ManagerTransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data
  const transaction = {
    id: id,
    invoiceId: 'INV-001',
    amount: 580000,
    paymentMethod: 'credit_card',
    externalTransactionId: 'STRIPE_CH_123456',
    note: 'Thanh toán đơn hàng #ORD-2024-001',
    transactionStatus: 'success',
    createdAt: '2024-02-01 10:35:00',
    gatewayResponse: '{"id": "ch_123", "status": "succeeded", "amount": 580000, "currency": "vnd"}'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
      </div>

      <Card title={<span className="text-xl font-bold">Chi tiết Giao Dịch #{transaction.id}</span>} bordered={false}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Mã Hóa Đơn">
            <a onClick={() => navigate(`/manager/invoices/${transaction.invoiceId}`)}>{transaction.invoiceId}</a>
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền">
            <span className="font-bold text-lg">{transaction.amount.toLocaleString('vi-VN')} đ</span>
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            {transaction.paymentMethod === 'credit_card' ? 'Thẻ Tín Dụng' : transaction.paymentMethod}
          </Descriptions.Item>
          <Descriptions.Item label="Mã tham chiếu (External ID)">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{transaction.externalTransactionId}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={transaction.transactionStatus === 'success' ? 'success' : 'error'}>
              {transaction.transactionStatus === 'success' ? 'Thành công' : 'Thất bại'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian giao dịch">{transaction.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú">{transaction.note}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Dữ liệu cổng thanh toán (Raw)</Divider>
        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs text-gray-700 font-mono">
            {JSON.stringify(JSON.parse(transaction.gatewayResponse || '{}'), null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
};

export default ManagerTransactionDetail;
