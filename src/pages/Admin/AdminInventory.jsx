import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Button, Modal, Form, Select, App, Space } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { queryInventoryTransactionsApi, createInventoryTransactionApi } from '../../api/inventoryApi';

const typeColorMap = {
  IMPORT: 'green',
  EXPORT: 'red',
  ADJUSTMENT: 'blue',
};

const typeLabelMap = {
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  ADJUSTMENT: 'Điều chỉnh',
};

const AdminInventory = () => {
  const { message } = App.useApp();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterType, setFilterType] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTransactions(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async (pageNumber = 1, pageSize = 10, type = '') => {
    setLoading(true);
    try {
      const payload = {
        type: type || null,
        pageNumber,
        pageSize
      };
      const result = await queryInventoryTransactionsApi(payload);
      setTransactions(result.data?.items || result.data || []);
      setPagination({
        current: pageNumber,
        pageSize,
        total: result.data?.total || 0
      });
    } catch (error) {
      message.error('Không thể tải lịch sử kho.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize, filterType);
  };

  const handleFilterTypeChange = (value) => {
    setFilterType(value);
    fetchTransactions(1, pagination.pageSize, value);
  };

  const handleCreateTransaction = async (values) => {
    setSubmitLoading(true);
    try {
      await createInventoryTransactionApi(values);
      message.success('Tạo giao dịch kho thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchTransactions(pagination.current, pagination.pageSize, filterType);
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi khi tạo giao dịch.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã biến thể',
      dataIndex: 'designVariantCode',
      key: 'designVariantCode',
      render: (code, record) => <span style={{ fontWeight: 600 }}>{code || record.designVariant?.code || record.designVariantId?.substring(0, 8) || '—'}</span>
    },
    {
      title: 'Tên biến thể',
      dataIndex: 'designVariantName',
      key: 'designVariantName',
      render: (name, record) => name || record.designVariant?.name || '—'
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={typeColorMap[type] || 'default'}>
          {typeLabelMap[type] || type}
        </Tag>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: (qty, record) => {
        const isPositive = record.type === 'IMPORT' || qty > 0;
        return (
          <span style={{ fontWeight: 700, color: isPositive ? '#48bb78' : '#e53e3e' }}>
            {isPositive ? '+' : ''}{qty}
          </span>
        );
      }
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note) => note || '—'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created',
      key: 'created',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : '—'
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho</h1>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
          Tạo giao dịch kho
        </Button>
      </div>

      <Card className="shadow-sm rounded-lg border-0">
        <div className="mb-6">
          <Select
            defaultValue=""
            size="large"
            className="w-60"
            onChange={handleFilterTypeChange}
            options={[
              { value: '', label: 'Tất cả loại giao dịch' },
              { value: 'IMPORT', label: '📥 Nhập kho' },
              { value: 'EXPORT', label: '📤 Xuất kho' },
              { value: 'ADJUSTMENT', label: '🔧 Điều chỉnh' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={transactions}
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

      {/* Modal tạo giao dịch kho */}
      <Modal
        title="Tạo giao dịch kho mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTransaction} className="mt-4">
          <Form.Item
            name="designVariantId"
            label="ID Biến thể (Design Variant)"
            rules={[{ required: true, message: 'Nhập ID biến thể' }]}
          >
            <Input placeholder="Paste ID biến thể (GUID)" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label="Loại giao dịch"
              rules={[{ required: true, message: 'Chọn loại' }]}
            >
              <Select
                placeholder="Chọn loại"
                options={[
                  { value: 'IMPORT', label: '📥 Nhập kho' },
                  { value: 'EXPORT', label: '📤 Xuất kho' },
                  { value: 'ADJUSTMENT', label: '🔧 Điều chỉnh' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Số lượng"
              rules={[{ required: true, message: 'Nhập số lượng' }]}
            >
              <Input type="number" placeholder="VD: 10" />
            </Form.Item>
          </div>

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
