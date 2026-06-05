import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, Popconfirm, App,
  Tooltip, Switch, Space, InputNumber, Row, Col, Typography, Empty,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getAllServiceOptionsApi, createServiceOptionApi, updateServiceOptionApi,
  activateServiceOptionApi, deactivateServiceOptionApi, deleteServiceOptionApi,
} from '../../api/serviceApi';

const { Text } = Typography;

const GROUP_CODES = [
  { value: 'DESIGN_PACKAGE', label: 'DESIGN_PACKAGE — Gói thiết kế' },
  { value: 'COMPLEXITY', label: 'COMPLEXITY — Độ phức tạp' },
  { value: 'DEADLINE', label: 'DEADLINE — Thời hạn' },
  { value: 'DELIVERABLE', label: 'DELIVERABLE — Sản phẩm giao' },
  { value: 'PRINTABILITY', label: 'PRINTABILITY — Khả năng in' },
  { value: 'MODEL_SCOPE', label: 'MODEL_SCOPE — Phạm vi mô hình' },
  { value: 'REVISION', label: 'REVISION — Lượt hiệu chỉnh' },
  { value: 'NEW_SCOPE', label: 'NEW_SCOPE — Phạm vi mới' },
];

const SELECTION_TYPES = [
  { value: 'SINGLE', label: 'SINGLE — Chọn 1 (radio)' },
  { value: 'MULTIPLE', label: 'MULTIPLE — Chọn nhiều (checkbox)' },
  { value: 'QUANTITY', label: 'QUANTITY — Số lượng (stepper)' },
  { value: 'ADDON', label: 'ADDON — Bật/tắt (toggle)' },
];

const formatVnd = (n) => n != null ? `${Number(n).toLocaleString('vi-VN')}₫` : '—';

const AdminServices = () => {
  const { message } = App.useApp();

  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [optionMode, setOptionMode] = useState('add');
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [optionSubmitLoading, setOptionSubmitLoading] = useState(false);
  const [optionForm] = Form.useForm();

  useEffect(() => { fetchOptions(); }, []);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const result = await getAllServiceOptionsApi();
      setOptions(result.data || []);
    } catch {
      message.error('Không thể tải danh sách tùy chọn.');
    } finally {
      setOptionsLoading(false);
    }
  };

  // Group by GroupCode
  const groupedOptions = useMemo(() => {
    const groups = {};
    options.forEach((opt) => {
      const gc = opt.groupCode || 'OTHER';
      if (!groups[gc]) groups[gc] = { groupCode: gc, groupName: opt.groupName || gc, options: [] };
      groups[gc].options.push(opt);
    });
    Object.values(groups).forEach((g) =>
      g.options.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );
    return Object.values(groups);
  }, [options]);

  const handleOpenAdd = () => {
    setOptionMode('add');
    setEditingOptionId(null);
    optionForm.resetFields();
    optionForm.setFieldsValue({ sortOrder: 0, isActive: true, minQuantity: 1 });
    setOptionModal(true);
  };

  const handleOpenEdit = (record) => {
    setOptionMode('edit');
    setEditingOptionId(record.id);
    optionForm.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      groupCode: record.groupCode,
      groupName: record.groupName,
      selectionType: record.selectionType,
      defaultPrice: record.defaultPrice,
      minQuantity: record.minQuantity,
      maxQuantity: record.maxQuantity,
      adjustmentRoundDelta: record.adjustmentRoundDelta,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
    });
    setOptionModal(true);
  };

  const handleSaveOption = async (values) => {
    setOptionSubmitLoading(true);
    try {
      const payload = {
        ...values,
        code: (values.code || '').toUpperCase(),
      };

      if (optionMode === 'add') {
        await createServiceOptionApi(payload);
        message.success('Đã tạo tùy chọn dịch vụ');
      } else {
        await updateServiceOptionApi(editingOptionId, payload);
        message.success('Đã cập nhật');
      }
      setOptionModal(false);
      fetchOptions();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setOptionSubmitLoading(false);
    }
  };

  const handleToggle = async (record) => {
    try {
      if (record.isActive) {
        await deactivateServiceOptionApi(record.id);
      } else {
        await activateServiceOptionApi(record.id);
      }
      message.success('Đã thay đổi trạng thái');
      fetchOptions();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Thất bại');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteServiceOptionApi(id);
      message.success('Đã xóa');
      fetchOptions();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (/order|đơn hàng|đã được/i.test(msg)) {
        message.warning('Không thể xóa — tùy chọn đã được dùng trong đơn hàng. Hãy vô hiệu hóa.');
      } else {
        message.error(msg || 'Xóa thất bại');
      }
    }
  };

  const optionColumns = [
    { title: 'Mã', dataIndex: 'code', width: 120, render: (v) => <Text code>{v || '—'}</Text> },
    { title: 'Tên', dataIndex: 'name', ellipsis: true },
    {
      title: 'Kiểu chọn', dataIndex: 'selectionType', width: 110,
      render: (t) => <Tag color={t === 'SINGLE' ? 'blue' : t === 'QUANTITY' ? 'orange' : t === 'MULTIPLE' ? 'cyan' : 'purple'}>{t}</Tag>,
    },
    { title: 'Giá', dataIndex: 'defaultPrice', width: 120, align: 'right', render: formatVnd },
    {
      title: 'Lượt sửa', dataIndex: 'adjustmentRoundDelta', width: 80, align: 'center',
      render: (v) => v > 0 ? <Tag color="purple">+{v}</Tag> : '—',
    },
    { title: 'Thứ tự', dataIndex: 'sortOrder', width: 70, align: 'center' },
    {
      title: '', key: 'actions', width: 140, align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Switch size="small" checked={record.isActive} onChange={() => handleToggle(record)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          <Popconfirm title="Xóa tùy chọn?" onConfirm={() => handleDelete(record.id)} okText="Xóa" okType="danger">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">Quản lý Dịch vụ</h1>
          <Text type="secondary">Tùy chọn dịch vụ thiết kế & in 3D — nhóm theo GroupCode</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          Thêm tùy chọn
        </Button>
      </div>

      {groupedOptions.length === 0 && !optionsLoading ? (
        <Card><Empty description="Chưa có tùy chọn dịch vụ nào" /></Card>
      ) : (
        groupedOptions.map((group) => (
          <Card
            key={group.groupCode}
            title={<span>{group.groupName} <Tag className="ml-2">{group.groupCode}</Tag></span>}
            size="small"
            className="mb-4 shadow-sm"
          >
            <Table
              dataSource={group.options}
              columns={optionColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={optionsLoading}
            />
          </Card>
        ))
      )}

      {/* Modal Thêm/Sửa */}
      <Modal
        title={optionMode === 'add' ? 'Tạo tùy chọn dịch vụ' : 'Sửa tùy chọn dịch vụ'}
        open={optionModal}
        onCancel={() => setOptionModal(false)}
        onOk={() => optionForm.submit()}
        confirmLoading={optionSubmitLoading}
        width={640}
        destroyOnClose
      >
        <Form form={optionForm} layout="vertical" onFinish={handleSaveOption} className="mt-2">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Mã (Code)" rules={[{ required: true }]}
                extra="Tự động uppercase khi lưu">
                <Input placeholder="VD: PKG_BASIC" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                <Input placeholder="VD: Gói thiết kế cơ bản" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="groupCode" label="Nhóm (GroupCode)" rules={[{ required: true }]}>
                <Select options={GROUP_CODES} placeholder="Chọn nhóm..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="groupName" label="Tên nhóm">
                <Input placeholder="VD: Gói thiết kế" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="selectionType" label="Kiểu chọn" rules={[{ required: true }]}>
                <Select options={SELECTION_TYPES} placeholder="Chọn kiểu..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultPrice" label="Giá mặc định (VNĐ)" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v?.replace(/,/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Min/Max Quantity — chỉ hiện khi QUANTITY */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.selectionType !== cur.selectionType}>
            {({ getFieldValue }) => getFieldValue('selectionType') === 'QUANTITY' && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="minQuantity" label="Min Quantity" initialValue={1}>
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="maxQuantity" label="Max Quantity">
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form.Item>

          {/* AdjustmentRoundDelta — chỉ hiện khi REVISION */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.groupCode !== cur.groupCode}>
            {({ getFieldValue }) => getFieldValue('groupCode') === 'REVISION' && (
              <Form.Item name="adjustmentRoundDelta" label="Số lượt hiệu chỉnh"
                rules={[{ required: true, message: 'Bắt buộc cho nhóm REVISION' }]}
                extra="Số lượt sửa tăng thêm khi khách chọn option này">
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sortOrder" label="Thứ tự hiển thị" initialValue={0}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminServices;
