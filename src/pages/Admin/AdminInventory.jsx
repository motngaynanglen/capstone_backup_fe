import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Select, App, Space, Input, InputNumber, Row, Col, Tooltip } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { queryInventoryTransactionsApi, createInventoryTransactionApi } from '../../api/inventoryApi';
import designVariantApi from '../../api/designVariantApi';
import {
  CREATABLE_TRANSACTION_TYPES,
  DIRECTION_FILTERS,
  resolveTransactionType,
  formatQuantityChange,
  INVENTORY_TRANSACTION_TYPES,
} from '../../constants/inventoryTransactionTypes';

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  ...Object.values(INVENTORY_TRANSACTION_TYPES).map((t) => ({ value: t.value, label: t.label })),
];

const AdminInventory = () => {
  const { message } = App.useApp();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterDirection, setFilterDirection] = useState('');
  const [filterType, setFilterType] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [variantList, setVariantList] = useState([]);
  const [variantLoading, setVariantLoading] = useState(false);

  const [form] = Form.useForm();
  const watchedType = Form.useWatch('type', form);
  const watchedDirection = Form.useWatch('direction', form);

  useEffect(() => {
    fetchTransactions(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async (pageNumber = 1, pageSize = 10, direction = filterDirection, type = filterType) => {
    setLoading(true);
    try {
      const payload = {
        pageNumber,
        pageSize,
        direction: direction || null,
        type: type || null,
      };
      const result = await queryInventoryTransactionsApi(payload);
      const list = result.data || [];
      setTransactions(list);
      setPagination({
        current: pageNumber,
        pageSize,
        total: result.additionalData?.paging?.totalCount || list.length,
      });
    } catch {
      message.error('Không thể tải lịch sử kho.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async () => {
    setVariantLoading(true);
    try {
      const res = await designVariantApi.getAll({ isActive: true });
      setVariantList(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setVariantLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize);
  };

  const openCreateModal = (direction = 'IN') => {
    form.resetFields();
    if (direction === 'OUT') {
      form.setFieldsValue({ direction: 'OUT', type: 'ADJUSTMENT' });
    } else {
      form.setFieldsValue({ direction: 'IN', type: 'PRODUCTION_IN' });
    }
    fetchVariants();
    setIsModalOpen(true);
  };

  const handleCreateTransaction = async (values) => {
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

    setSubmitLoading(true);
    try {
      await createInventoryTransactionApi({
        designVariantId: values.designVariantId,
        type: values.type,
        quantity: signedQuantity,
        note: values.note?.trim() || undefined,
      });
      message.success('Tạo giao dịch kho thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchTransactions(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi khi tạo giao dịch.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderDirectionTag = (record) => {
    const { direction } = formatQuantityChange(record.quantity);
    if (direction === 'IN') return <Tag color="green" icon={<ArrowDownOutlined />}>Nhập</Tag>;
    if (direction === 'OUT') return <Tag color="red" icon={<ArrowUpOutlined />}>Xuất</Tag>;
    return <Tag>—</Tag>;
  };

  const columns = [
    {
      title: 'Hướng',
      width: 90,
      render: (_, record) => renderDirectionTag(record),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (_, record) => {
        const meta = resolveTransactionType(record.type, record);
        return <Tag color={meta.color}>{record.typeLabel || meta.label}</Tag>;
      },
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'variantName',
      render: (name) => name || '—',
    },
    {
      title: 'Thay đổi SL',
      dataIndex: 'quantity',
      align: 'center',
      render: (qty) => {
        const { text, color } = formatQuantityChange(qty);
        return <span style={{ fontWeight: 700, color }}>{text}</span>;
      },
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'staffName',
      render: (name) => name || 'Hệ thống',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: (note) => note || '—',
    },
    {
      title: 'Thời gian',
      dataIndex: 'created',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : '—',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho</h1>
        <Space>
          <Button type="primary" icon={<ArrowDownOutlined />} size="large" onClick={() => openCreateModal('IN')}>
            Nhập kho
          </Button>
          <Button danger icon={<ArrowUpOutlined />} size="large" onClick={() => openCreateModal('OUT')}>
            Xuất kho
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm rounded-lg border-0">
        <Space wrap className="mb-6">
          <Select
            value={filterDirection}
            size="large"
            className="w-48"
            onChange={(v) => { setFilterDirection(v); fetchTransactions(1, pagination.pageSize, v, filterType); }}
            options={DIRECTION_FILTERS}
          />
          <Select
            value={filterType}
            size="large"
            className="w-52"
            onChange={(v) => { setFilterType(v); fetchTransactions(1, pagination.pageSize, filterDirection, v); }}
            options={TYPE_FILTER_OPTIONS}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={watchedDirection === 'OUT' ? 'Xuất kho' : 'Nhập kho'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTransaction} className="mt-4">
          <Form.Item
            name="designVariantId"
            label="Sản phẩm"
            rules={[{ required: true, message: 'Chọn sản phẩm' }]}
          >
            <Select
              showSearch
              loading={variantLoading}
              placeholder="Chọn sản phẩm..."
              optionFilterProp="label"
              options={variantList.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.code}) — Tồn: ${v.stockQuantity ?? 0}`,
              }))}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="direction" label="Hướng" rules={[{ required: true }]}>
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
              <Form.Item name="type" label="Loại giao dịch" rules={[{ required: true }]}>
                <Select
                  options={CREATABLE_TRANSACTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  onChange={(type) => {
                    const meta = INVENTORY_TRANSACTION_TYPES[type];
                    if (meta?.direction === 'IN') form.setFieldValue('direction', 'IN');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: 'Nhập số lượng' }]}
            extra={watchedDirection === 'OUT' ? 'Sẽ trừ khỏi tồn kho' : 'Sẽ cộng vào tồn kho'}
          >
            <InputNumber min={1} className="w-full" placeholder="VD: 10" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú cho giao dịch kho..." />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>Tạo giao dịch</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminInventory;
