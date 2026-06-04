import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Button, Modal, Form, App, Space, Tooltip } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { queryShipmentsApi, getShipmentDetailApi } from '../../api/shipmentApi';

const statusColorMap = {
  PENDING: 'gold',
  SHIPPING: 'blue',
  SHIPPED: 'geekblue',
  DELIVERED: 'green',
  FAILED: 'red',
};

const statusLabelMap = {
  PENDING: 'Chờ giao',
  SHIPPING: 'Đang giao',
  SHIPPED: 'Đã gửi',
  DELIVERED: 'Đã nhận',
  FAILED: 'Thất bại',
};

const AdminShipmentList = () => {
  const { message } = App.useApp();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');

  const [detailModal, setDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchShipments(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShipments = async (pageNumber = 1, pageSize = 10, search = '') => {
    setLoading(true);
    try {
      const payload = {
        search: search || null,
        sortBy: 'Created',
        sortDescending: true,
        paging: { pageNumber, pageSize }
      };
      const result = await queryShipmentsApi(payload);
      setShipments(result.data?.items || result.data || []);
      setPagination({
        current: pageNumber,
        pageSize,
        total: result.data?.total || 0
      });
    } catch (error) {
      message.error('Không thể tải danh sách vận đơn.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchShipments(newPagination.current, newPagination.pageSize, searchText);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchShipments(1, pagination.pageSize, value);
  };

  const handleViewDetail = async (record) => {
    try {
      const result = await getShipmentDetailApi(record.id);
      setSelectedShipment(result.data || result);
      setDetailModal(true);
    } catch (error) {
      message.error('Không thể tải chi tiết vận đơn.');
    }
  };

  const handleUpdateShipment = async () => {
    setSubmitLoading(true);
    message.warning('Cập nhật vận đơn thủ công đang tạm ẩn. Hãy xử lý vận chuyển trong chi tiết đơn hàng.');
    setSubmitLoading(false);
  };

  const columns = [
    {
      title: 'Mã vận đơn',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      render: (val) => <span style={{ fontWeight: 600 }}>{val || '—'}</span>
    },
    {
      title: 'Đơn vị vận chuyển',
      dataIndex: 'carrier',
      key: 'carrier',
      render: (val) => val || '—'
    },
    {
      title: 'Phí vận chuyển',
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      align: 'right',
      render: (fee) => fee ? `${Number(fee).toLocaleString('vi-VN')}₫` : '—'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusLabelMap[status] || status || '—'}
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
      title: 'Ngày giao',
      dataIndex: 'deliveredDate',
      key: 'deliveredDate',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined style={{ color: '#667eea' }} />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Cập nhật vận chuyển trong chi tiết đơn hàng">
            <Button type="text" disabled>
              —
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Vận đơn</h1>
      </div>

      <Card className="shadow-sm rounded-lg border-0">
        <div className="mb-6">
          <Input.Search
            placeholder="Tìm mã vận đơn, đơn vị vận chuyển..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="max-w-md"
          />
        </div>

        <Table
          columns={columns}
          dataSource={shipments}
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

      {/* Modal xem chi tiết */}
      <Modal
        title="Chi tiết Vận đơn"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={<Button onClick={() => setDetailModal(false)}>Đóng</Button>}
        width={600}
      >
        {selectedShipment && (
          <div className="space-y-3 mt-4">
            <p><strong>Mã vận đơn:</strong> {selectedShipment.trackingNumber || '—'}</p>
            <p><strong>Đơn vị vận chuyển:</strong> {selectedShipment.carrier || '—'}</p>
            <p><strong>Phí vận chuyển:</strong> {selectedShipment.shippingFee ? `${Number(selectedShipment.shippingFee).toLocaleString('vi-VN')}₫` : '—'}</p>
            <p><strong>Trạng thái:</strong> <Tag color={statusColorMap[selectedShipment.status]}>{statusLabelMap[selectedShipment.status] || selectedShipment.status}</Tag></p>
            <p><strong>Ngày tạo:</strong> {selectedShipment.created ? new Date(selectedShipment.created).toLocaleString('vi-VN') : '—'}</p>
            <p><strong>Ngày gửi:</strong> {selectedShipment.shippedDate ? new Date(selectedShipment.shippedDate).toLocaleString('vi-VN') : '—'}</p>
            <p><strong>Ngày giao:</strong> {selectedShipment.deliveredDate ? new Date(selectedShipment.deliveredDate).toLocaleString('vi-VN') : '—'}</p>
            <p><strong>Ghi chú:</strong> {selectedShipment.note || 'Không có'}</p>
          </div>
        )}
      </Modal>

      {/* Modal cập nhật */}
      <Modal
        title="Cập nhật Vận đơn"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateShipment} className="mt-4">
          <Form.Item name="trackingNumber" label="Mã vận đơn">
            <Input placeholder="Nhập mã tracking" />
          </Form.Item>
          <Form.Item name="carrier" label="Đơn vị vận chuyển">
            <Input placeholder="VD: GHTK, GHN, J&T..." />
          </Form.Item>
          <Form.Item name="shippingFee" label="Phí vận chuyển">
            <Input type="number" placeholder="VD: 30000" addonAfter="₫" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditModal(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>Lưu thay đổi</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminShipmentList;
