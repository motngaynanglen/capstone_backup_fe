import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Spin, App, Timeline, Table, Popconfirm, Divider } from 'antd';
import { ArrowLeftOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getOrderDetailApi, cancelOrderApi } from '../../api/orderApi';
import StaffCarrierActions from '../../components/Shipping/StaffCarrierActions';

const statusColorMap = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  PROCESSING: 'cyan',
  SHIPPED: 'geekblue',
  DELIVERED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'green',
};

const statusLabelMap = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
};

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const result = await getOrderDetailApi(id);
      setOrder(result.data || result);
    } catch (error) {
      message.error('Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrderApi(id, 'Admin hủy đơn hàng');
      message.success('Đã hủy đơn hàng!');
      fetchOrderDetail();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => name || record.designVariant?.name || record.designTemplate?.name || '—'
    },
    {
      title: 'Mã biến thể',
      dataIndex: 'designVariantCode',
      key: 'designVariantCode',
      render: (code, record) => code || record.designVariant?.code || '—'
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center'
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (price) => price ? `${Number(price).toLocaleString('vi-VN')}₫` : '—'
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subTotal',
      key: 'subTotal',
      align: 'right',
      render: (sub, record) => {
        const total = sub || (record.unitPrice * record.quantity);
        return total ? `${Number(total).toLocaleString('vi-VN')}₫` : '—';
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p>Không tìm thấy đơn hàng</p>
        <Button onClick={() => navigate('/admin/orders')}>Quay lại</Button>
      </div>
    );
  }

  const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'DELIVERED';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')}>
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          Chi tiết Đơn hàng #{order.code || id?.substring(0, 8)}
        </h1>
        <Tag color={statusColorMap[order.status]} style={{ fontSize: '14px', padding: '4px 12px' }}>
          {statusLabelMap[order.status] || order.status}
        </Tag>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin đơn hàng */}
        <Card title="Thông tin đơn hàng" className="lg:col-span-2 shadow-sm rounded-lg border-0">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Mã đơn">{order.code || id?.substring(0, 8)}</Descriptions.Item>
            <Descriptions.Item label="Loại nguồn">{order.sourceType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{order.created ? new Date(order.created).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <span style={{ fontWeight: 700, color: '#667eea', fontSize: '16px' }}>
                {order.totalAmount ? `${Number(order.totalAmount).toLocaleString('vi-VN')}₫` : '—'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>{order.note || 'Không có ghi chú'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Thông tin khách hàng */}
        <Card title="Khách hàng" className="shadow-sm rounded-lg border-0">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Tên">{order.customer?.fullname || order.customerName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{order.customer?.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="SĐT">{order.customer?.contactPhone || '—'}</Descriptions.Item>
          </Descriptions>

          {order.shippingAddress && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Địa chỉ giao hàng</h4>
              <p className="text-sm text-gray-700">
                {order.shippingAddress.recipientName}, {order.shippingAddress.phone}<br />
                {order.shippingAddress.addressLine}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Danh sách sản phẩm */}
      <Card title="Danh sách sản phẩm" className="mt-6 shadow-sm rounded-lg border-0">
        <Table
          columns={itemColumns}
          dataSource={order.items || order.orderItems || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="Vận chuyển GHN" className="mt-6 shadow-sm rounded-lg border-0">
        <StaffCarrierActions
          orderId={id}
          orderStatus={order.status || order.orderStatus}
          onUpdated={fetchOrderDetail}
        />
      </Card>

      {/* Actions */}
      {canCancel && (
        <div className="mt-6 flex justify-end">
          <Popconfirm
            title="Hủy đơn hàng?"
            description="Đơn hàng sẽ bị hủy và không thể hoàn tác."
            onConfirm={handleCancel}
            okText="Hủy đơn"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="large" icon={<CloseCircleOutlined />}>
              Hủy đơn hàng
            </Button>
          </Popconfirm>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
