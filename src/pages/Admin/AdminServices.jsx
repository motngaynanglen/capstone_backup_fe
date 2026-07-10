import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Popconfirm, App, Tooltip, Switch, Tabs, Space, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getAllServiceOptionsApi, createServiceOptionApi, updateServiceOptionApi,
  activateServiceOptionApi, deactivateServiceOptionApi, deleteServiceOptionApi,
  queryServicePackagesApi, createServicePackageApi
} from '../../api/serviceApi';

const AdminServices = () => {
  const { message } = App.useApp();

  // ==========================================
  // SERVICE OPTIONS STATE
  // ==========================================
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [optionMode, setOptionMode] = useState('add');
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [optionSubmitLoading, setOptionSubmitLoading] = useState(false);
  const [optionForm] = Form.useForm();

  // ==========================================
  // SERVICE PACKAGES STATE
  // ==========================================
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packageModal, setPackageModal] = useState(false);
  const [packageSubmitLoading, setPackageSubmitLoading] = useState(false);
  const [packageForm] = Form.useForm();

  useEffect(() => {
    fetchOptions();
    fetchPackages();
  }, []);

  // ==========================================
  // SERVICE OPTIONS CRUD
  // ==========================================
  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const result = await getAllServiceOptionsApi();
      setOptions(result.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách tùy chọn.');
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleOpenAddOption = () => {
    setOptionMode('add');
    setEditingOptionId(null);
    optionForm.resetFields();
    setOptionModal(true);
  };

  const handleOpenEditOption = (record) => {
    setOptionMode('edit');
    setEditingOptionId(record.id);
    optionForm.setFieldsValue({
      name: record.name,
      optionType: record.optionType,
      defaultPrice: record.defaultPrice,
    });
    setOptionModal(true);
  };

  const handleSubmitOption = async (values) => {
    setOptionSubmitLoading(true);
    try {
      if (optionMode === 'add') {
        await createServiceOptionApi({
          code: '',
          name: values.name,
          optionType: values.optionType,
          defaultPrice: values.defaultPrice
        });
        message.success('Tạo tùy chọn thành công!');
      } else {
        await updateServiceOptionApi(editingOptionId, {
          name: values.name,
          optionType: values.optionType,
          defaultPrice: values.defaultPrice
        });
        message.success('Cập nhật tùy chọn thành công!');
      }
      setOptionModal(false);
      fetchOptions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setOptionSubmitLoading(false);
    }
  };

  const handleToggleOptionActive = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await deactivateServiceOptionApi(id);
        message.success('Đã ngưng tùy chọn!');
      } else {
        await activateServiceOptionApi(id);
        message.success('Đã kích hoạt tùy chọn!');
      }
      fetchOptions();
    } catch (error) {
      message.error('Thao tác thất bại.');
    }
  };

  const handleDeleteOption = async (id) => {
    try {
      await deleteServiceOptionApi(id);
      message.success('Đã xóa tùy chọn!');
      fetchOptions();
    } catch (error) {
      message.error('Lỗi khi xóa.');
    }
  };

  // ==========================================
  // SERVICE PACKAGES CRUD
  // ==========================================
  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const result = await queryServicePackagesApi({
        search: '',
        service: null,
        sortBy: 'Created',
        sortDescending: true
      });
      setPackages(result.data?.items || result.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách gói dịch vụ.');
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleOpenAddPackage = () => {
    packageForm.resetFields();
    setPackageModal(true);
  };

  const handleSubmitPackage = async (values) => {
    setPackageSubmitLoading(true);
    try {
      await createServicePackageApi({
        code: values.code,
        name: values.name,
        serviceType: values.serviceType,
        basePrice: values.basePrice,
        description: values.description,
        options: []
      });
      message.success('Tạo gói dịch vụ thành công!');
      setPackageModal(false);
      fetchPackages();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setPackageSubmitLoading(false);
    }
  };

  // ==========================================
  // TABLE COLUMNS
  // ==========================================
  const optionColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', render: (val) => <span style={{ fontWeight: 600 }}>{val || '—'}</span> },
    { title: 'Tên tùy chọn', dataIndex: 'name', key: 'name' },
    {
      title: 'Loại',
      dataIndex: 'optionType',
      key: 'optionType',
      render: (type) => <Tag color={type === 'ADDON' ? 'purple' : 'cyan'}>{type}</Tag>
    },
    {
      title: 'Giá mặc định',
      dataIndex: 'defaultPrice',
      key: 'defaultPrice',
      align: 'right',
      render: (price) => price != null ? `${Number(price).toLocaleString('vi-VN')}₫` : '—'
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? 'Hoạt động' : 'Ngưng'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.isActive ? 'Ngưng' : 'Kích hoạt'}>
            <Switch
              size="small"
              checked={record.isActive}
              onChange={() => handleToggleOptionActive(record.id, record.isActive)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => handleOpenEditOption(record)} />
          </Tooltip>
          <Popconfirm title="Xóa tùy chọn?" onConfirm={() => handleDeleteOption(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const packageColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', render: (val) => <span style={{ fontWeight: 600 }}>{val || '—'}</span> },
    { title: 'Tên gói', dataIndex: 'name', key: 'name' },
    {
      title: 'Loại dịch vụ',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (type) => <Tag color={type === 'DESIGN' ? 'blue' : 'orange'}>{type}</Tag>
    },
    {
      title: 'Giá cơ bản',
      dataIndex: 'basePrice',
      key: 'basePrice',
      align: 'right',
      render: (price) => price != null ? `${Number(price).toLocaleString('vi-VN')}₫` : '—'
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || '—'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created',
      key: 'created',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
    }
  ];

  const tabItems = [
    {
      key: 'options',
      label: '⚙️ Tùy chọn dịch vụ (Service Options)',
      children: (
        <>
          <div className="flex justify-end mb-4">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddOption}>
              Thêm tùy chọn
            </Button>
          </div>
          <Table
            columns={optionColumns}
            dataSource={options}
            rowKey="id"
            loading={optionsLoading}
            pagination={false}
          />
        </>
      )
    },
    {
      key: 'packages',
      label: '📦 Gói dịch vụ (Service Packages)',
      children: (
        <>
          <div className="flex justify-end mb-4">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddPackage}>
              Thêm gói dịch vụ
            </Button>
          </div>
          <Table
            columns={packageColumns}
            dataSource={packages}
            rowKey="id"
            loading={packagesLoading}
            pagination={false}
          />
        </>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Dịch vụ</h1>
      </div>

      <Card className="shadow-sm rounded-lg border-0">
        <Tabs items={tabItems} size="large" />
      </Card>

      {/* Modal Thêm/Sửa Service Option */}
      <Modal
        title={optionMode === 'add' ? 'Thêm tùy chọn dịch vụ' : 'Cập nhật tùy chọn'}
        open={optionModal}
        onCancel={() => setOptionModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={optionForm} layout="vertical" onFinish={handleSubmitOption} className="mt-4">
          <Form.Item name="name" label="Tên tùy chọn" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: Đánh bóng, Sơn PU..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="optionType" label="Loại" rules={[{ required: true, message: 'Chọn loại' }]}>
              <Select
                placeholder="Chọn loại"
                options={[
                  { value: 'ADDON', label: 'ADDON' },
                  { value: 'CONFIG', label: 'CONFIG' },
                ]}
              />
            </Form.Item>
            <Form.Item name="defaultPrice" label="Giá mặc định" rules={[{ required: true, message: 'Nhập giá' }]}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="VD: 50000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/,/g, '')}
                addonAfter="₫"
              />
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOptionModal(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={optionSubmitLoading}>
              {optionMode === 'add' ? 'Tạo mới' : 'Lưu'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Thêm Service Package */}
      <Modal
        title="Thêm gói dịch vụ"
        open={packageModal}
        onCancel={() => setPackageModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={packageForm} layout="vertical" onFinish={handleSubmitPackage} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="code" label="Mã gói" rules={[{ required: true }]}>
              <Input placeholder="VD: P1, P2..." />
            </Form.Item>
            <Form.Item name="serviceType" label="Loại dịch vụ" rules={[{ required: true }]}>
              <Select
                placeholder="Chọn loại"
                options={[
                  { value: 'DESIGN', label: 'Thiết kế (DESIGN)' },
                  { value: 'PRINTING', label: 'In 3D (PRINTING)' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="name" label="Tên gói" rules={[{ required: true }]}>
            <Input placeholder="VD: Gói cơ bản, Gói cao cấp..." />
          </Form.Item>
          <Form.Item name="basePrice" label="Giá cơ bản" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="VD: 200000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/,/g, '')}
              addonAfter="₫"
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả gói dịch vụ..." />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPackageModal(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={packageSubmitLoading}>Tạo mới</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminServices;
