import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Space,
  Typography,
  Segmented,
  message,
  Tooltip,
  Badge,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { getProductionQueueApi, updateOrderItemFulfillmentApi } from '../../api/orderApi';
import StaffOrderDetailModal from '../../components/Staff/StaffOrderDetailModal';
import {
  normalizeProductionQueueOrder,
  fulfillmentStatusMap,
  normStatus,
} from '../../utils/staffOrderConstants';
import { formatVnd, formatDateTime, shortId } from '../../utils/formatters';

const { Title, Text } = Typography;

const FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ in', value: 'PENDING' },
  { label: 'Đang in', value: 'PRINTING' },
];

function renderFulfillment(status) {
  const s = fulfillmentStatusMap[normStatus(status)];
  return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
}

export default function StaffProductionQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busyItemId, setBusyItemId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductionQueueApi({
        pageNumber: 1,
        pageSize: 200,
        fulfillmentFilter: filter,
        search: search.trim() || undefined,
      });
      const list = (res?.data || [])
        .map(normalizeProductionQueueOrder)
        .filter(Boolean);
      setOrders(list);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Không tải được hàng đợi sản xuất');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (highlightOrderId) {
      setSelectedOrderId(highlightOrderId);
      setModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      }, { replace: true });
    }
  }, [highlightOrderId, setSearchParams]);

  const openDetail = (orderId) => {
    setSelectedOrderId(orderId);
    setModalOpen(true);
  };

  const quickFulfillment = async (orderItemId, fulfillmentStatus) => {
    setBusyItemId(orderItemId);
    try {
      const res = await updateOrderItemFulfillmentApi(orderItemId, { fulfillmentStatus });
      const data = res?.data;
      message.success(data?.message || `Đã cập nhật → ${fulfillmentStatus}`);
      if (data?.allProductionLinesFinished) {
        message.info('Tất cả dòng đã xong — chuyển đơn sang FINISHED tại «Đơn shop & GHN».');
      }
      await load();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setBusyItemId(null);
    }
  };

  const expandedRowRender = (record) => (
    <Table
      rowKey="orderItemId"
      size="small"
      pagination={false}
      dataSource={record.lines}
      columns={[
        {
          title: 'Sản phẩm',
          dataIndex: 'itemName',
          render: (name, line) => (
            <div>
              <Text>{name}</Text>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>{line.sourceType}</Text>
              </div>
            </div>
          ),
        },
        { title: 'SL', dataIndex: 'quantityOrdered', width: 56, align: 'center' },
        {
          title: 'Tiến độ',
          dataIndex: 'fulfillmentStatus',
          width: 120,
          render: (s) => renderFulfillment(s),
        },
        {
          title: 'Thao tác nhanh',
          key: 'actions',
          width: 220,
          render: (_, line) => {
            const fs = normStatus(line.fulfillmentStatus);
            if (fs === 'FINISHED' || fs === 'CANCELLED') {
              return <Tag color="success">Hoàn tất</Tag>;
            }
            const busy = busyItemId === line.orderItemId;
            return (
              <Space size={4}>
                {fs !== 'PRINTING' && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<PrinterOutlined />}
                    loading={busy}
                    onClick={() => quickFulfillment(line.orderItemId, 'PRINTING')}
                  >
                    Bắt đầu in
                  </Button>
                )}
                {fs === 'PRINTING' && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={busy}
                    onClick={() => quickFulfillment(line.orderItemId, 'FINISHED')}
                  >
                    In xong
                  </Button>
                )}
              </Space>
            );
          },
        },
      ]}
    />
  );

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      width: 140,
      render: (code, r) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => openDetail(r.orderId)}>
          <Text strong>{code || shortId(r.orderId)}</Text>
        </Button>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      ellipsis: true,
    },
    {
      title: 'Dòng SX',
      key: 'lines',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Badge count={r.pendingPrintCount} showZero color="blue">
          <Tag>{r.lines?.length ?? 0}</Tag>
        </Badge>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      width: 130,
      align: 'right',
      render: (v) => formatVnd(v),
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'orderStatus',
      width: 120,
      render: (s) => <Tag color="processing">{s}</Tag>,
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
      width: 80,
      fixed: 'right',
      render: (_, r) => (
        <Tooltip title="Chi tiết & thao tác đầy đủ">
          <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(r.orderId)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Hàng đợi sản xuất
        </Title>
        <Text type="secondary">
          Đơn đã thanh toán — cập nhật tiến độ in 3D từng sản phẩm trước khi giao hàng.
        </Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              placeholder="Tìm mã đơn, khách hàng..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={load}
              allowClear
              style={{ width: 280 }}
            />
            <Segmented
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Làm mới
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="orderId"
          loading={loading}
          columns={columns}
          dataSource={orders}
          expandable={{ expandedRowRender, defaultExpandAllRows: false }}
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 20,
            showTotal: (t) => `${t} đơn trong hàng đợi`,
          }}
          locale={{ emptyText: 'Không có đơn nào đang chờ sản xuất.' }}
        />
      </Card>

      <StaffOrderDetailModal
        open={modalOpen}
        orderId={selectedOrderId}
        onClose={() => {
          setModalOpen(false);
          setSelectedOrderId(null);
        }}
        onUpdated={load}
      />
    </div>
  );
}
