import React, { useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  activateServiceOptionApi,
  createServiceOptionApi,
  deactivateServiceOptionApi,
  deleteServiceOptionApi,
  getAllServiceOptionsApi,
  updateServiceOptionApi,
} from '../../api/serviceApi';

const { Text } = Typography;

const GROUP_CODES = [
  { value: 'DESIGN_PACKAGE', groupName: 'Gói thiết kế', label: 'DESIGN_PACKAGE - Gói thiết kế' },
  { value: 'COMPLEXITY', groupName: 'Độ phức tạp', label: 'COMPLEXITY - Độ phức tạp' },
  { value: 'DEADLINE', groupName: 'Thời hạn', label: 'DEADLINE - Thời hạn' },
  { value: 'DELIVERABLE', groupName: 'Sản phẩm bàn giao', label: 'DELIVERABLE - Sản phẩm bàn giao' },
  { value: 'PRINTABILITY', groupName: 'Khả năng in', label: 'PRINTABILITY - Khả năng in' },
  { value: 'MODEL_SCOPE', groupName: 'Phạm vi mô hình', label: 'MODEL_SCOPE - Phạm vi mô hình' },
  { value: 'REVISION', groupName: 'Lượt hiệu chỉnh', label: 'REVISION - Lượt hiệu chỉnh' },
  { value: 'NEW_SCOPE', groupName: 'Phạm vi mới', label: 'NEW_SCOPE - Phạm vi mới' },
];

const SELECTION_TYPES = [
  { value: 'SINGLE', label: 'SINGLE - Chọn 1' },
  { value: 'MULTIPLE', label: 'MULTIPLE - Chọn nhiều' },
  { value: 'QUANTITY', label: 'QUANTITY - Theo số lượng' },
  { value: 'ADDON', label: 'ADDON - Bật/tắt' },
];

const pick = (obj, camel, pascal) => {
  if (!obj) return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (pascal && obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
};

const formatVnd = (value) =>
  value != null ? `${Number(value).toLocaleString('vi-VN')} đ` : '-';

const getErrorMessage = (err, fallback = 'Thao tác thất bại') =>
  err?.response?.data?.message
  || err?.response?.data?.title
  || err?.message
  || fallback;

const getGroupName = (groupCode, currentName) => {
  if (currentName?.trim()) return currentName.trim();
  return GROUP_CODES.find((group) => group.value === groupCode)?.groupName || groupCode || 'Chung';
};

const normalizeServiceOption = (item = {}) => ({
  id: pick(item, 'id', 'Id'),
  code: pick(item, 'code', 'Code') || '',
  name: pick(item, 'name', 'Name') || '',
  description: pick(item, 'description', 'Description') || '',
  groupCode: pick(item, 'groupCode', 'GroupCode') || 'OTHER',
  groupName: pick(item, 'groupName', 'GroupName') || pick(item, 'groupCode', 'GroupCode') || 'Khác',
  selectionType: pick(item, 'selectionType', 'SelectionType') || 'ADDON',
  defaultPrice: Number(pick(item, 'defaultPrice', 'DefaultPrice') ?? 0),
  minQuantity: Number(pick(item, 'minQuantity', 'MinQuantity') ?? 1),
  maxQuantity: pick(item, 'maxQuantity', 'MaxQuantity') ?? null,
  adjustmentRoundDelta: pick(item, 'adjustmentRoundDelta', 'AdjustmentRoundDelta') ?? null,
  sortOrder: Number(pick(item, 'sortOrder', 'SortOrder') ?? 0),
  isActive: Boolean(pick(item, 'isActive', 'IsActive')),
});

const extractServiceOptions = (response) => {
  const raw =
    Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response)
            ? response
            : [];

  return raw.map(normalizeServiceOption);
};

const buildPayload = (values, isEdit) => {
  const groupCode = (values.groupCode || '').trim().toUpperCase();
  const selectionType = (values.selectionType || '').trim().toUpperCase();
  const isQuantity = selectionType === 'QUANTITY';
  const isRevision = groupCode === 'REVISION';

  const payload = {
    code: (values.code || '').trim().toUpperCase(),
    name: (values.name || '').trim(),
    description: values.description?.trim() || null,
    groupCode,
    groupName: getGroupName(groupCode, values.groupName),
    selectionType,
    defaultPrice: Number(values.defaultPrice || 0),
    minQuantity: isQuantity ? Number(values.minQuantity || 1) : 1,
    maxQuantity: isQuantity && values.maxQuantity != null ? Number(values.maxQuantity) : null,
    adjustmentRoundDelta: isRevision ? Number(values.adjustmentRoundDelta || 0) : null,
    sortOrder: Number(values.sortOrder || 0),
  };

  if (isEdit) {
    payload.isActive = Boolean(values.isActive);
    payload.clearDescription = !payload.description;
    payload.clearMaxQuantity = !isQuantity;
    payload.clearAdjustmentRoundDelta = !isRevision;
  }

  return payload;
};

export default function AdminServices() {
  const { message } = App.useApp();

  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [optionMode, setOptionMode] = useState('add');
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [optionSubmitLoading, setOptionSubmitLoading] = useState(false);
  const [optionForm] = Form.useForm();

  const watchedSelectionType = Form.useWatch('selectionType', optionForm);
  const watchedGroupCode = Form.useWatch('groupCode', optionForm);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const result = await getAllServiceOptionsApi({ pageNumber: 1, pageSize: 100, sortBy: 'Group' });
      setOptions(extractServiceOptions(result));
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể tải danh sách tùy chọn dịch vụ.'));
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const groupedOptions = useMemo(() => {
    const groups = new Map();

    options.forEach((option) => {
      const key = option.groupCode || 'OTHER';
      if (!groups.has(key)) {
        groups.set(key, {
          groupCode: key,
          groupName: option.groupName || key,
          options: [],
        });
      }
      groups.get(key).options.push(option);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      options: [...group.options].sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name)),
    }));
  }, [options]);

  const handleOpenAdd = () => {
    setOptionMode('add');
    setEditingOptionId(null);
    optionForm.resetFields();
    optionForm.setFieldsValue({
      sortOrder: 0,
      isActive: true,
      minQuantity: 1,
      selectionType: 'ADDON',
      defaultPrice: 0,
    });
    setOptionModal(true);
  };

  const handleOpenEdit = (record) => {
    const option = normalizeServiceOption(record);
    setOptionMode('edit');
    setEditingOptionId(option.id);
    optionForm.setFieldsValue(option);
    setOptionModal(true);
  };

  const handleSaveOption = async (values) => {
    setOptionSubmitLoading(true);
    try {
      const isEdit = optionMode === 'edit';
      const payload = buildPayload(values, isEdit);

      if (isEdit) {
        await updateServiceOptionApi(editingOptionId, payload);
        message.success('Đã cập nhật tùy chọn dịch vụ');
      } else {
        await createServiceOptionApi(payload);
        message.success('Đã tạo tùy chọn dịch vụ');
      }

      setOptionModal(false);
      fetchOptions();
    } catch (err) {
      message.error(getErrorMessage(err));
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
      message.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteServiceOptionApi(id);
      message.success('Đã xóa tùy chọn');
      fetchOptions();
    } catch (err) {
      const msg = getErrorMessage(err, 'Xóa thất bại');
      if (/order|đơn hàng|used|foreign|constraint/i.test(msg)) {
        message.warning('Không thể xóa vì tùy chọn đã được sử dụng. Hãy vô hiệu hóa tùy chọn này.');
      } else {
        message.error(msg);
      }
    }
  };

  const optionColumns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 140,
      render: (value) => <Text code>{value || '-'}</Text>,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Kiểu chọn',
      dataIndex: 'selectionType',
      width: 130,
      render: (type) => (
        <Tag color={type === 'SINGLE' ? 'blue' : type === 'QUANTITY' ? 'orange' : type === 'MULTIPLE' ? 'cyan' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'defaultPrice',
      width: 130,
      align: 'right',
      render: formatVnd,
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) => record.selectionType === 'QUANTITY'
        ? `${record.minQuantity}${record.maxQuantity ? `-${record.maxQuantity}` : '+'}`
        : '-',
    },
    {
      title: 'Lượt sửa',
      dataIndex: 'adjustmentRoundDelta',
      width: 90,
      align: 'center',
      render: (value) => value > 0 ? <Tag color="purple">+{value}</Tag> : '-',
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      width: 80,
      align: 'center',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Switch size="small" checked={record.isActive} onChange={() => handleToggle(record)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa tùy chọn?"
            description="Nếu tùy chọn đã được dùng trong đơn hàng, hãy vô hiệu hóa thay vì xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            okType="danger"
            cancelText="Hủy"
          >
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
          <h1 className="text-2xl font-bold text-gray-800 m-0">Quản lý dịch vụ</h1>
          <Text type="secondary">Quản lý các tùy chọn dịch vụ thiết kế 3D theo nhóm.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          Thêm tùy chọn
        </Button>
      </div>

      {groupedOptions.length === 0 && !optionsLoading ? (
        <Card>
          <Empty description="Chưa có tùy chọn dịch vụ nào" />
        </Card>
      ) : (
        groupedOptions.map((group) => (
          <Card
            key={group.groupCode}
            title={(
              <span>
                {group.groupName} <Tag className="ml-2">{group.groupCode}</Tag>
              </span>
            )}
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

      <Modal
        title={optionMode === 'add' ? 'Tạo tùy chọn dịch vụ' : 'Sửa tùy chọn dịch vụ'}
        open={optionModal}
        onCancel={() => setOptionModal(false)}
        onOk={() => optionForm.submit()}
        confirmLoading={optionSubmitLoading}
        width={680}
        destroyOnClose
      >
        <Form form={optionForm} layout="vertical" onFinish={handleSaveOption} className="mt-2">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã"
                rules={[{ required: true, message: 'Vui lòng nhập mã tùy chọn' }]}
              >
                <Input placeholder="VD: PKG_BASIC" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên"
                rules={[{ required: true, message: 'Vui lòng nhập tên tùy chọn' }]}
              >
                <Input placeholder="VD: Gói thiết kế cơ bản" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="groupCode"
                label="Nhóm"
                rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}
              >
                <Select
                  options={GROUP_CODES}
                  placeholder="Chọn nhóm"
                  onChange={(value) => {
                    optionForm.setFieldValue('groupName', getGroupName(value));
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="groupName" label="Tên nhóm">
                <Input placeholder="Tự điền theo nhóm nếu bỏ trống" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="selectionType"
                label="Kiểu chọn"
                rules={[{ required: true, message: 'Vui lòng chọn kiểu' }]}
              >
                <Select options={SELECTION_TYPES} placeholder="Chọn kiểu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="defaultPrice"
                label="Giá mặc định (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          {watchedSelectionType === 'QUANTITY' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="minQuantity"
                  label="Số lượng tối thiểu"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng tối thiểu' }]}
                >
                  <InputNumber min={1} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="maxQuantity" label="Số lượng tối đa">
                  <InputNumber min={1} className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {watchedGroupCode === 'REVISION' && (
            <Form.Item
              name="adjustmentRoundDelta"
              label="Số lượt hiệu chỉnh cộng thêm"
              rules={[{ required: true, message: 'Nhóm REVISION bắt buộc có số lượt hiệu chỉnh' }]}
              extra="REVISION phải có số lượt hiệu chỉnh lớn hơn 0."
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sortOrder" label="Thứ tự hiển thị">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
