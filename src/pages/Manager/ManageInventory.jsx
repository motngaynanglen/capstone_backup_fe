import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Select, Modal, Form, InputNumber, Card, Row, Col,
  Tag, Space, Typography, message, Empty, Statistic, Tooltip, Input,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  ArrowDownOutlined, ArrowUpOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import inventoryApi from '../../api/inventoryApi';
import designVariantApi from '../../api/designVariantApi';
import {
  INVENTORY_TRANSACTION_TYPES,
  CREATABLE_TRANSACTION_TYPES,
  DIRECTION_FILTERS,
  resolveTransactionType,
  formatQuantityChange,
} from '../../constants/inventoryTransactionTypes';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  ...Object.values(INVENTORY_TRANSACTION_TYPES).map((t) => ({
    value: t.value,
    label: t.label,
  })),
];

const ManageInventory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDirection, setFilterDirection] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVariantId, setFilterVariantId] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const watchedType = Form.useWatch('type', form);
  const watchedDirection = Form.useWatch('direction', form);

  const [variantList, setVariantList] = useState([]);
  const [variantLoading, setVariantLoading] = useState(false);

  const pageSummary = useMemo(() => {
    return transactions.reduce(
      (acc, row) => {
        const qty = Number(row.quantity) || 0;
        if (qty > 0) acc.inbound += qty;
        else if (qty < 0) acc.outbound += Math.abs(qty);
        return acc;
      },
      { inbound: 0, outbound: 0 },
    );
  }, [transactions]);

  useEffect(() => {
    fetchTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildQueryParams = (page, direction = filterDirection, type = filterType, variantId = filterVariantId) => {
    const params = {
      pageNumber: page,
      pageSize: pagination.pageSize,
    };
    if (direction) params.direction = direction;
    if (type) params.type = type;
    if (variantId) params.designVariantId = variantId;
    return params;
  };

  const fetchTransactions = async (page = 1, direction = filterDirection, type = filterType, variantId = filterVariantId) => {
    setLoading(true);
    try {
      const res = await inventoryApi.query(buildQueryParams(page, direction, type, variantId));
      const list = res?.data || [];
      setTransactions(list);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: res?.additionalData?.paging?.totalCount || list.length,
      }));
    } catch {
      message.error('Không thể tải lịch sử kho');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilterDirection('');
    setFilterType('');
    setFilterVariantId(null);
    fetchTransactions(1, '', '', null);
  };

  const fetchVariants = async () => {
    setVariantLoading(true);
    try {
      const res = await designVariantApi.getAll({ isActive: true });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setVariantList(list);
    } catch {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setVariantLoading(false);
    }
  };

  const openCreateModal = (direction = 'IN') => {
    form.resetFields();
    if (direction === 'OUT') {
      form.setFieldsValue({ direction: 'OUT', type: 'ADJUSTMENT' });
    } else {
      form.setFieldsValue({ direction: 'IN', type: 'PRODUCTION_IN' });
    }
    fetchVariants();
    setIsCreateModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const qty = Number(values.quantity);
      if (!qty || qty <= 0) {
        message.warning('Số lượng phải lớn hơn 0');
        return;
      }

      let signedQuantity = qty;
      if (values.type === 'ADJUSTMENT') {
        signedQuantity = values.direction === 'OUT' ? -qty : qty;
      } else if (values.direction === 'OUT') {
        signedQuantity = -qty;
      }

      setCreating(true);
      await inventoryApi.create({
        designVariantId: values.designVariantId,
        type: values.type,
        quantity: signedQuantity,
        note: values.note?.trim() || undefined,
      });
      message.success('Tạo giao dịch kho thành công!');
      form.resetFields();
      setIsCreateModalOpen(false);
      fetchTransactions(1);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || 'Tạo giao dịch thất bại');
    } finally {
      setCreating(false);
    }
  };

  const renderDirectionTag = (record) => {
    const { direction } = formatQuantityChange(record.quantity);
    if (direction === 'IN') {
      return <Tag color="green" icon={<ArrowDownOutlined />}>Nhập</Tag>;
    }
    if (direction === 'OUT') {
      return <Tag color="red" icon={<ArrowUpOutlined />}>Xuất</Tag>;
    }
    return <Tag>Không đổi</Tag>;
  };

  const renderTypeTag = (record) => {
    const meta = resolveTransactionType(record.type, record);
    const Icon = meta.icon;
    return (
      <Tooltip title={meta.description || record.type}>
        <Tag color={record.typeColor ? undefined : meta.color} style={record.typeColor ? { borderColor: record.typeColor, color: record.typeColor } : undefined}>
          {Icon ? <Icon style={{ marginRight: 4 }} /> : null}
          {record.typeLabel || meta.label}
        </Tag>
      </Tooltip>
    );
  };

  const renderQuantity = (quantity) => {
    const { text, color } = formatQuantityChange(quantity);
    return <span style={{ color, fontWeight: 700, fontSize: 15 }}>{text}</span>;
  };

  const columns = [
    {
      title: 'STT',
      width: 55,
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: 'Hướng',
      width: 90,
      render: (_, record) => renderDirectionTag(record),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      width: 150,
      render: (_, record) => renderTypeTag(record),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'variantName',
      ellipsis: true,
      render: (name, record) => (
        <div>
          <Text strong>{name || '—'}</Text>
          {record.designVariantId && (
            <div><Text type="secondary" code className="text-xs">{record.designVariantId.slice(0, 8)}…</Text></div>
          )}
        </div>
      ),
    },
    {
      title: 'Thay đổi SL',
      dataIndex: 'quantity',
      width: 110,
      align: 'center',
      render: renderQuantity,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'staffName',
      width: 130,
      ellipsis: true,
      render: (name) => name || 'Hệ thống',
    },
    {
      title: 'Mã tham chiếu',
      dataIndex: 'referenceId',
      width: 120,
      ellipsis: true,
      render: (id) => id ? <Text code className="text-xs">{String(id).slice(0, 8)}…</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: (note) => note || <Text type="secondary">—</Text>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'created',
      width: 145,
      render: (date) => date ? format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—',
    },
  ];

  const selectedVariant = variantList.find((v) => v.id === filterVariantId);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý kho</Title>
          <Text type="secondary">Theo dõi biến động nhập — xuất tồn kho theo từng sản phẩm</Text>
        </div>
        <Space wrap>
          <Button icon={<ArrowDownOutlined />} onClick={() => openCreateModal('IN')}>
            Nhập kho
          </Button>
          <Button danger icon={<ArrowUpOutlined />} onClick={() => openCreateModal('OUT')}>
            Xuất kho
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title="Nhập kho (trang hiện tại)"
              value={pageSummary.inbound}
              valueStyle={{ color: '#10b981' }}
              prefix={<ArrowDownOutlined />}
              suffix="sp"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic
              title="Xuất kho (trang hiện tại)"
              value={pageSummary.outbound}
              valueStyle={{ color: '#ef4444' }}
              prefix={<ArrowUpOutlined />}
              suffix="sp"
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card size="small">
            <Statistic
              title="Tổng giao dịch"
              value={pagination.total}
              suffix="bản ghi"
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={10}>
            <Select
              showSearch
              allowClear
              placeholder="Lọc theo sản phẩm..."
              style={{ width: '100%' }}
              loading={variantLoading}
              value={filterVariantId}
              onFocus={() => { if (!variantList.length) fetchVariants(); }}
              onChange={(v) => {
                setFilterVariantId(v || null);
                fetchTransactions(1, filterDirection, filterType, v || null);
              }}
              optionFilterProp="label"
              options={variantList.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.code}) — Tồn: ${v.stockQuantity ?? 0}`,
              }))}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              placeholder="Hướng"
              style={{ width: '100%' }}
              value={filterDirection}
              onChange={(v) => {
                setFilterDirection(v);
                fetchTransactions(1, v, filterType, filterVariantId);
              }}
              options={DIRECTION_FILTERS}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              placeholder="Loại giao dịch"
              style={{ width: '100%' }}
              value={filterType}
              onChange={(v) => {
                setFilterType(v);
                fetchTransactions(1, filterDirection, v, filterVariantId);
              }}
              options={TYPE_FILTER_OPTIONS}
            />
          </Col>
          <Col xs={24} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchTransactions(1)}>Lọc</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm mới</Button>
            </Space>
          </Col>
        </Row>
        {selectedVariant && (
          <Text type="secondary" className="mt-3 block">
            Đang xem kho: <Text strong>{selectedVariant.name}</Text> — Tồn hiện tại: <Text strong>{selectedVariant.stockQuantity ?? 0}</Text> sp
          </Text>
        )}
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={transactions}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (t) => `Tổng ${t} giao dịch`,
            onChange: (page) => fetchTransactions(page),
          }}
          locale={{ emptyText: <Empty description="Không có giao dịch nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <Modal
        title={watchedDirection === 'OUT' ? 'Xuất kho' : 'Nhập kho'}
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        okText={watchedDirection === 'OUT' ? 'Xác nhận xuất kho' : 'Xác nhận nhập kho'}
        cancelText="Hủy"
        confirmLoading={creating}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="designVariantId"
            label="Sản phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              showSearch
              placeholder="Tìm và chọn sản phẩm..."
              loading={variantLoading}
              optionFilterProp="label"
              options={variantList.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.code}) — Tồn: ${v.stockQuantity ?? 0}`,
              }))}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="direction"
                label="Hướng"
                rules={[{ required: true, message: 'Chọn hướng nhập/xuất' }]}
              >
                <Select
                  options={[
                    { value: 'IN', label: 'Nhập kho (+)' },
                    { value: 'OUT', label: 'Xuất kho (−)' },
                  ]}
                  disabled={watchedType && watchedType !== 'ADJUSTMENT' && INVENTORY_TRANSACTION_TYPES[watchedType]?.direction === 'IN'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại giao dịch"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
              >
                <Select
                  placeholder="Chọn loại"
                  onChange={(type) => {
                    const meta = INVENTORY_TRANSACTION_TYPES[type];
                    if (meta?.direction === 'IN') form.setFieldValue('direction', 'IN');
                    if (meta?.direction === 'OUT') form.setFieldValue('direction', 'OUT');
                  }}
                >
                  {CREATABLE_TRANSACTION_TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>{t.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            extra={
              watchedDirection === 'OUT'
                ? 'Số lượng sẽ được trừ khỏi tồn kho'
                : 'Số lượng sẽ được cộng vào tồn kho'
            }
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="VD: 10" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <TextArea rows={3} placeholder="Lý do nhập/xuất/điều chỉnh..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageInventory;
