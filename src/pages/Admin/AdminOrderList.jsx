import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Select, Space, Button, Popconfirm, Modal, App } from 'antd';
import { SearchOutlined, EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { queryOrdersApi, cancelOrderApi } from '../../api/orderApi';

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

const AdminOrderList = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchOrders(1, pagination.pageSize, searchText, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async (pageNumber = 1, pageSize = 10, search = '', status = '') => {
    setLoading(true);
    try {
      const payload = {
        search: search || null,
        status: status || null,
        sortBy: 'created',
        sortDescending: true,
        pageNumber,
        pageSize
      };
      const result = await queryOrdersApi(payload);
      setOrders(result.data?.items || result.data || []);
      setPagination({
        current: pageNumber,
        pageSize,
        total: result.data?.total || 0
      });
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchOrders(newPagination.current, newPagination.pageSize, searchText, filterStatus);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchOrders(1, pagination.pageSize, value, filterStatus);
  };

  const handleFilterStatusChange = (value) => {
    setFilterStatus(value);
    fetchOrders(1, pagination.pageSize, searchText, value);
  };

  const handleCancel = async (id) => {
    try {
      await cancelOrderApi(id, 'Admin hủy đơn hàng');
      message.success('Đã hủy đơn hàng!');
      fetchOrders(pagination.current, pagination.pageSize, searchText, filterStatus);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <a onClick={() => navigate(`/admin/orders/${record.id}`)} style={{ fontWeight: 600, color: '#667eea' }}>
          {code || record.id?.substring(0, 8)}
        </a>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name, record) => name || record.customer?.fullname || '—'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => amount ? `${Number(amount).toLocaleString('vi-VN')}₫` : '—'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusLabelMap[status] || status}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created',
      key: 'created',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: '#667eea' }} />}
            onClick={() => navigate(`/admin/orders/${record.id}`)}
          />
          {record.status !== 'CANCELLED' && record.status !== 'COMPLETED' && record.status !== 'DELIVERED' && (
            <Popconfirm
              title="Hủy đơn hàng?"
              description="Đơn hàng sẽ bị hủy và không thể hoàn tác."
              onConfirm={() => handleCancel(record.id)}
              okText="Hủy đơn"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<CloseCircleOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
      </div>

      <Card className="shadow-sm rounded-lg border-0">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input.Search
            placeholder="Tìm mã đơn, tên khách..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="max-w-md"
          />
          <Select
            defaultValue=""
            size="large"
            className="w-48"
            onChange={handleFilterStatusChange}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'PENDING', label: 'Chờ xác nhận' },
              { value: 'CONFIRMED', label: 'Đã xác nhận' },
              { value: 'PROCESSING', label: 'Đang xử lý' },
              { value: 'SHIPPED', label: 'Đang giao' },
              { value: 'DELIVERED', label: 'Đã giao' },
              { value: 'COMPLETED', label: 'Hoàn thành' },
              { value: 'CANCELLED', label: 'Đã hủy' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default AdminOrderList;
