import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table, Button, Input, Select, Modal, Card, Row, Col, Tag, Space,
  Typography, message, Empty, Descriptions, Divider, Badge, Tooltip
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, StopOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { queryOrdersApi, getOrderDetailApi, cancelOrderApi } from '../../api/orderApi';
import StaffCarrierActions from '../../components/Shipping/StaffCarrierActions';
import { normalizeOrderRow, normalizeOrderDetail } from '../../utils/orderNormalize';
import { formatVnd } from '../../utils/formatters';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Chờ xác nhận', color: 'orange' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
  { value: 'PROCESSING', label: 'Đang xử lý', color: 'cyan' },
  { value: 'FINISHED', label: 'Sẵn sàng giao', color: 'geekblue' },
  { value: 'SHIPPING', label: 'Đang giao', color: 'purple' },
  { value: 'DELIVERED', label: 'Đã giao', color: 'green' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'success' },
];

const statusMap = Object.fromEntries(ORDER_STATUSES.map(s => [s.value, s]));

const CANCELLABLE = ['PENDING', 'CONFIRMED'];

const shortCode = (r) => {
  const c = r?.code || r?.orderCode || r?.id;
  if (!c) return '—';
  const s = String(c);
  return s.length > 12 ? `${s.slice(0, 8)}…` : s;
};

const ManageOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openOrderId = searchParams.get('openOrderId');

  const handleViewDetail = useCallback(async (record) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await getOrderDetailApi(record.id);
      setSelectedOrder(normalizeOrderDetail(res?.data || res));
    } catch {
      message.error('Không thể tải chi tiết đơn hàng');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchOrders = async (page = 1, search = searchTerm, status = filterStatus) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: pagination.pageSize,
      };
      if (search?.trim()) params.search = search.trim();
      if (status) params.status = status;

      const res = await queryOrdersApi(params);
      const list = (res?.data || []).map(normalizeOrderRow).filter(Boolean);
      setOrders(list);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: res?.additionalData?.paging?.totalCount || list.length,
      }));
    } catch (err) {
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openOrderId) return;
    handleViewDetail({ id: openOrderId });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('openOrderId');
      return next;
    }, { replace: true });
  }, [openOrderId, handleViewDetail, setSearchParams]);

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus(null);
    fetchOrders(1, '', null);
  };

  const handleCancel = (record) => {
    confirm({
      title: `Hủy đơn hàng #${record.orderCode || record.id}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Đơn hàng sẽ bị hủy và không thể khôi phục.',
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: async () => {
        try {
          await cancelOrderApi(record.id);
          message.success('Đã hủy đơn hàng thành công');
          fetchOrders(pagination.current);
          // Cập nhật detail nếu đang mở
          if (selectedOrder?.id === record.id) {
            setSelectedOrder((prev) => ({ ...prev, orderStatus: 'CANCELLED', status: 'CANCELLED' }));
          }
        } catch (err) {
          message.error(err?.response?.data?.message || 'Hủy đơn thất bại');
        }
      },
    });
  };

  const renderStatus = (status) => {
    const s = statusMap[status];
    return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status}</Tag>;
  };

  const orderStatusOf = (r) => r.orderStatus || r.status;

  const columns = [
    {
      title: 'Mã đơn',
      key: 'code',
      width: 130,
      render: (_, record) => (
        <Text strong className="text-indigo-600">{shortCode(record)}</Text>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name, record) => (
        <div>
          <div className="font-medium">{name || '—'}</div>
          <div className="text-xs text-gray-400">{record.customerPhone || ''}</div>
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 130,
      align: 'right',
      render: (val) => <Text strong>{formatVnd(val)}</Text>,
    },
    {
      title: 'Trạng thái',
      key: 'orderStatus',
      width: 140,
      render: (_, r) => renderStatus(orderStatusOf(r)),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created',
      key: 'created',
      width: 130,
      render: (d, r) => {
        const dt = d || r.createdAt;
        return dt ? format(new Date(dt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—';
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          {CANCELLABLE.includes(orderStatusOf(record)) && (
            <Tooltip title="Hủy đơn">
              <Button type="text" danger icon={<StopOutlined />} onClick={() => handleCancel(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Title level={3} style={{ margin: 0 }}>Quản lý đơn hàng</Title>
        <Text type="secondary">Tra cứu, xem chi tiết và hủy đơn hàng</Text>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm theo mã đơn, khách hàng..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onPressEnter={() => fetchOrders(1)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Trạng thái"
              style={{ width: 160 }}
              allowClear
              value={filterStatus}
              onChange={v => { setFilterStatus(v); fetchOrders(1, searchTerm, v); }}
            >
              {ORDER_STATUSES.map(s => (
                <Option key={s.value} value={s.value}>
                  <Tag color={s.color}>{s.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchOrders(1)}>Tìm kiếm</Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm mới</Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: t => `Tổng ${t} đơn hàng`,
            onChange: page => fetchOrders(page),
          }}
          locale={{ emptyText: <Empty description="Không có đơn hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết đơn hàng${selectedOrder ? ` #${shortCode(selectedOrder)}` : ''}`}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          selectedOrder && CANCELLABLE.includes(orderStatusOf(selectedOrder)) && (
            <Button
              key="cancel"
              danger
              icon={<StopOutlined />}
              onClick={() => { setIsDetailOpen(false); handleCancel(selectedOrder); }}
            >
              Hủy đơn
            </Button>
          ),
          <Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>,
        ].filter(Boolean)}
        width={700}
        loading={detailLoading}
      >
        {detailLoading ? (
          <div className="text-center py-8 text-gray-400">Đang tải...</div>
        ) : selectedOrder && (
          <div className="mt-2">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã đơn" span={1}>
                <Text strong>{shortCode(selectedOrder)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={1}>
                {renderStatus(orderStatusOf(selectedOrder))}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng" span={1}>
                {selectedOrder.customerName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT" span={1}>
                {selectedOrder.customerPhone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedOrder.shippingAddress || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền" span={1}>
                <Text strong className="text-indigo-600">
                  {formatVnd(selectedOrder.totalPrice ?? selectedOrder.totalAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={1}>
                {(selectedOrder.created || selectedOrder.createdAt)
                  ? format(new Date(selectedOrder.created || selectedOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                  : '—'}
              </Descriptions.Item>
              {selectedOrder.note && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Order items */}
            {selectedOrder.items?.length > 0 && (
              <>
                <Divider orientation="left">Sản phẩm trong đơn</Divider>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={selectedOrder.items}
                  columns={[
                    {
                      title: 'Sản phẩm',
                      dataIndex: 'itemName',
                      render: (name, r) => name || r.variantName || shortCode(r),
                    },
                    {
                      title: 'SL',
                      dataIndex: 'quantityOrdered',
                      width: 60,
                      align: 'center',
                      render: (q, r) => q ?? r.quantity ?? 0,
                    },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'unitPrice',
                      width: 120,
                      align: 'right',
                      render: (v, r) => formatVnd(v ?? r.price),
                    },
                    {
                      title: 'Thành tiền',
                      width: 130,
                      align: 'right',
                      render: (_, r) => formatVnd(r.totalPrice ?? (r.unitPrice ?? r.price) * (r.quantityOrdered ?? r.quantity ?? 1)),
                    },
                    {
                      title: 'SX',
                      dataIndex: 'fulfillmentStatus',
                      width: 100,
                      render: (s) => {
                        const colors = { PRINTING: 'processing', FINISHED: 'success', PENDING: 'default' };
                        return <Tag color={colors[s] || 'default'}>{s || '—'}</Tag>;
                      },
                    },
                  ]}
                />
              </>
            )}

            {selectedOrder?.id && (
              <StaffCarrierActions
                orderId={selectedOrder.id}
                orderStatus={selectedOrder.orderStatus || selectedOrder.status}
                orderItems={selectedOrder.items || []}
                onUpdated={async () => {
                  try {
                    const res = await getOrderDetailApi(selectedOrder.id);
                    setSelectedOrder(normalizeOrderDetail(res?.data || res));
                  } catch { /* ignore */ }
                }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageOrders;
