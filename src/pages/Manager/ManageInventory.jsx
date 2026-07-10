import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Modal, Form, InputNumber, Card, Row, Col,
  Tag, Space, Tooltip, Typography, message, Empty
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, DatabaseOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SwapOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import inventoryApi from '../../api/inventoryApi';
import designVariantApi from '../../api/designVariantApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TRANSACTION_TYPES = [
  { value: 'IMPORT', label: 'Nhập kho', color: 'green', icon: <ArrowDownOutlined /> },
  { value: 'EXPORT', label: 'Xuất kho', color: 'red', icon: <ArrowUpOutlined /> },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh', color: 'blue', icon: <SwapOutlined /> },
];

const typeMap = Object.fromEntries(TRANSACTION_TYPES.map(t => [t.value, t]));

const ManageInventory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState(null);
  const [filterVariantId, setFilterVariantId] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Modal tạo giao dịch mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  // Modal tra cứu theo orderId
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [refOrderId, setRefOrderId] = useState('');
  const [refResult, setRefResult] = useState([]);
  const [refLoading, setRefLoading] = useState(false);

  // Danh sách variants cho select
  const [variantList, setVariantList] = useState([]);
  const [variantLoading, setVariantLoading] = useState(false);

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const fetchTransactions = async (page = 1, type = filterType, variantId = filterVariantId) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: pagination.pageSize,
      };
      if (type) params.type = type;
      if (variantId?.trim()) params.designVariantId = variantId.trim();

      const res = await inventoryApi.query(params);
      const list = res?.data || [];
      setTransactions(list);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: res?.additionalData?.paging?.totalCount || list.length,
      }));
    } catch (err) {
      message.error('Không thể tải lịch sử kho');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilterType(null);
    setFilterVariantId('');
    fetchTransactions(1, null, '');
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

  const openCreateModal = () => {
    form.resetFields();
    fetchVariants();
    setIsCreateModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await inventoryApi.create(values);
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

  const handleSearchByReference = async () => {
    if (!refOrderId.trim()) { message.warning('Vui lòng nhập Order ID'); return; }
    setRefLoading(true);
    try {
      const res = await inventoryApi.getByReference(refOrderId.trim());
      setRefResult(Array.isArray(res?.data) ? res.data : (res ? [res] : []));
    } catch (err) {
      message.error('Không tìm thấy lịch sử theo Order ID này');
      setRefResult([]);
    } finally {
      setRefLoading(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      width: 55,
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 130,
      render: (type) => {
        const t = typeMap[type];
        return t ? <Tag color={t.color} icon={t.icon}>{t.label}</Tag> : <Tag>{type}</Tag>;
      },
    },
    {
      title: 'Mã biến thể',
      dataIndex: 'designVariantId',
      ellipsis: true,
      render: (id) => <Text code className="text-xs">{id}</Text>,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      width: 100,
      align: 'right',
      render: (qty, record) => {
        const color = record.type === 'EXPORT' ? '#ef4444' : record.type === 'IMPORT' ? '#10b981' : '#3b82f6';
        return <span style={{ color, fontWeight: 600 }}>{record.type === 'EXPORT' ? '-' : '+'}{qty}</span>;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: (note) => note || <Text type="secondary">—</Text>,
    },
    {
      title: 'Reference',
      dataIndex: 'referenceId',
      ellipsis: true,
      render: (id) => id ? <Text code className="text-xs">{id}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 140,
      render: (date) => date ? format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—',
    },
  ];

  const refColumns = [
    { title: 'Loại', dataIndex: 'type', render: (type) => { const t = typeMap[type]; return t ? <Tag color={t.color}>{t.label}</Tag> : <Tag>{type}</Tag>; } },
    { title: 'Số lượng', dataIndex: 'quantity', align: 'right' },
    { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
    { title: 'Thời gian', dataIndex: 'createdAt', render: (d) => d ? format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý kho</Title>
          <Text type="secondary">Lịch sử biến động tồn kho và điều chỉnh</Text>
        </div>
        <Space>
          <Button icon={<DatabaseOutlined />} onClick={() => { setRefOrderId(''); setRefResult([]); setIsRefModalOpen(true); }}>
            Tra cứu theo Order
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Tạo giao dịch kho
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Nhập Design Variant ID để lọc..."
              value={filterVariantId}
              onChange={e => setFilterVariantId(e.target.value)}
              onPressEnter={() => fetchTransactions(1)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Loại giao dịch"
              style={{ width: 160 }}
              allowClear
              value={filterType}
              onChange={v => { setFilterType(v); fetchTransactions(1, v, filterVariantId); }}
            >
              {TRANSACTION_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchTransactions(1)}>Lọc</Button>
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
          dataSource={transactions}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: t => `Tổng ${t} giao dịch`,
            onChange: page => fetchTransactions(page),
          }}
          locale={{ emptyText: <Empty description="Không có giao dịch nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      {/* Modal tạo giao dịch */}
      <Modal
        title="Tạo giao dịch kho"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        okText="Tạo"
        cancelText="Hủy"
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="designVariantId"
            label="Sản phẩm (Design Variant)"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              showSearch
              placeholder="Tìm và chọn sản phẩm..."
              loading={variantLoading}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={variantList.map(v => ({
                value: v.id,
                label: `${v.name} (${v.code})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại giao dịch"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select placeholder="Chọn loại">
              {TRANSACTION_TYPES.map(t => (
                <Option key={t.value} value={t.value}>
                  <Tag color={t.color}>{t.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <TextArea rows={3} placeholder="Lý do nhập/xuất/điều chỉnh..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tra cứu theo Order ID */}
      <Modal
        title="Tra cứu kho theo Order ID"
        open={isRefModalOpen}
        onCancel={() => setIsRefModalOpen(false)}
        footer={[<Button key="close" onClick={() => setIsRefModalOpen(false)}>Đóng</Button>]}
        width={700}
        destroyOnClose
      >
        <Row gutter={8} className="mb-4" style={{ marginTop: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="Nhập Order ID (GUID)..."
              value={refOrderId}
              onChange={e => setRefOrderId(e.target.value)}
              onPressEnter={handleSearchByReference}
            />
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} loading={refLoading} onClick={handleSearchByReference}>
              Tìm
            </Button>
          </Col>
        </Row>
        <Table
          rowKey="id"
          columns={refColumns}
          dataSource={refResult}
          loading={refLoading}
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="Nhập Order ID và bấm Tìm" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Modal>
    </div>
  );
};

export default ManageInventory;
