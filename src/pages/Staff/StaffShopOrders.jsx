import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { queryOrdersApi } from '../../api/orderApi';
import StaffOrderDetailModal from '../../components/Staff/StaffOrderDetailModal';
import { normalizeOrderRow } from '../../utils/orderNormalize';
import { ORDER_STATUSES, orderStatusMap, normStatus } from '../../utils/staffOrderConstants';
import { formatVnd, formatDateTime } from '../../utils/formatters';

const { Title, Text } = Typography;

const STAFF_STATUS_FILTER = ORDER_STATUSES.filter((s) =>
  ['PENDING', 'PROCESSING', 'FINISHED', 'COMPLETED'].includes(s.value),
);

function renderStatus(status) {
  const s = orderStatusMap[normStatus(status)];
  return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
}

function shortOrderCode(order) {
  const code = order?.code || order?.id;
  if (!code) return '—';
  const s = String(code);
  return s.length > 12 ? `${s.slice(0, 10)}…` : s;
}

function renderPaymentTag(invoice) {
  const ps = normStatus(invoice?.paymentStatus);
  if (!ps) return null;
  if (ps === 'PAID') return <Tag color="success">Đã TT</Tag>;
  if (ps === 'PARTIALLY_PAID') return <Tag color="warning">Cọc</Tag>;
  return <Tag color="warning">Chưa TT</Tag>;
}

function renderGhnTag(order) {
  const hasGhn = Boolean(order.shipment?.carrierOrderCode);
  const ready = normStatus(order.orderStatus) === 'FINISHED' && !hasGhn;
  if (hasGhn) return <Tag color="green">GHN đã tạo</Tag>;
  if (ready) return <Tag color="orange" icon={<TruckOutlined />}>Chờ GHN</Tag>;
  return null;
}

function renderCombinedStatus(order) {
  return (
    <Space size={[4, 4]} wrap>
      {renderStatus(order.orderStatus)}
      {renderPaymentTag(order.invoice)}
      {renderGhnTag(order)}
    </Space>
  );
}

export default function StaffShopOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openOrderId = searchParams.get('openOrderId');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          pageNumber: page,
          pageSize: pagination.pageSize,
          sortDescending: true,
          sortBy: 'created',
        };
        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.status = statusFilter;

        const res = await queryOrdersApi(params);
        const list = (res?.data || []).map(normalizeOrderRow).filter(Boolean);
        setOrders(list);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: res?.additionalData?.paging?.totalCount || list.length,
        }));
      } catch {
        message.error('Không tải được danh sách đơn hàng');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, pagination.pageSize],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (openOrderId) {
      setSelectedOrderId(openOrderId);
      setModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('openOrderId');
        return next;
      }, { replace: true });
    }
  }, [openOrderId, setSearchParams]);

  const openDetail = (orderId) => {
    setSelectedOrderId(orderId);
    setModalOpen(true);
  };

  const stats = {
    processing: orders.filter((o) => normStatus(o.orderStatus) === 'PROCESSING').length,
    finished: orders.filter((o) => normStatus(o.orderStatus) === 'FINISHED').length,
    readyGhn: orders.filter(
      (o) =>
        normStatus(o.orderStatus) === 'FINISHED' &&
        !o.shipment?.carrierOrderCode,
    ).length,
  };

  const columns = [
    {
      title: 'Mã đơn',
      key: 'code',
      width: 140,
      ellipsis: true,
      render: (_, r) => {
        const fullCode = r.code || String(r.id);
        return (
          <Tooltip title={fullCode}>
            <Button
              type="link"
              style={{ padding: 0, maxWidth: '100%', height: 'auto' }}
              onClick={() => openDetail(r.id)}
            >
              <Text strong ellipsis style={{ maxWidth: 130 }}>
                {shortOrderCode(r)}
              </Text>
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      width: 110,
      ellipsis: true,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      width: 130,
      align: 'right',
      render: (v) => <Text strong>{formatVnd(v)}</Text>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 240,
      render: (_, r) => renderCombinedStatus(r),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created',
      width: 150,
      render: (d) => formatDateTime(d),
    },
    {
      title: '',
      key: 'actions',
      width: 72,
      fixed: 'right',
      render: (_, r) => (
        <Tooltip title="Xử lý đơn">
          <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(r.id)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Đơn shop & GHN
        </Title>
        <Text type="secondary">
          Chuyển trạng thái đơn, tạo vận đơn GHN và theo dõi giao hàng.
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Đang sản xuất" value={stats.processing} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Sẵn sàng giao" value={stats.finished} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ tạo GHN (trang này)"
              value={stats.readyGhn}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm mã đơn, khách hàng..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchOrders(1)}
            allowClear
            style={{ width: 280 }}
          />
          <Select
            placeholder="Lọc trạng thái"
            allowClear
            style={{ width: 200 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={STAFF_STATUS_FILTER.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchOrders(1)}>
            Tìm
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(pagination.current)}>
            Làm mới
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={orders}
          tableLayout="fixed"
          scroll={{ x: 840 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (t) => `${t} đơn hàng`,
            onChange: (page) => fetchOrders(page),
          }}
        />
      </Card>

      <StaffOrderDetailModal
        open={modalOpen}
        orderId={selectedOrderId}
        onClose={() => {
          setModalOpen(false);
          setSelectedOrderId(null);
        }}
        onUpdated={() => fetchOrders(pagination.current)}
      />
    </div>
  );
}
