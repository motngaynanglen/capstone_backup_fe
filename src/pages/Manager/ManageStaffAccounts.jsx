import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, message, Tag, Space, Tooltip, Card, Row, Col, Typography
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, ExclamationCircleOutlined, PoweroffOutlined } from '@ant-design/icons';
import { queryAccountsApi, createAccountApi, deleteAccountApi, activateAccountApi, deactivateAccountApi } from '../../api/accountApi';

const { Title, Text } = Typography;
const { confirm } = Modal;

const ManageStaffAccounts = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStaff(1);
  }, []);

  const fetchStaff = async (page = 1, search = searchTerm) => {
    setLoading(true);
    try {
      const res = await queryAccountsApi({
        role: 'STAFF',
        search: search || '',
        sortBy: 'Name',
        sortDescending: false,
        includeDeleted: false,
        paging: { pageNumber: page, pageSize: pagination.pageSize }
      });
      const list = res?.data || [];
      setStaffList(list);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: res?.additionalData?.paging?.totalCount || list.length
      }));
    } catch (err) {
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchStaff(1, searchTerm);

  const handleReset = () => {
    setSearchTerm('');
    fetchStaff(1, '');
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createAccountApi({ ...values, role: 'STAFF' });
      message.success('Tạo tài khoản nhân viên thành công!');
      form.resetFields();
      setIsModalOpen(false);
      fetchStaff(1);
    } catch (err) {
      if (err?.errorFields) return; // Validation error, do nothing
      message.error(err?.response?.data?.message || 'Tạo tài khoản thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (record) => {
    try {
      if (record.isActive) {
        await deactivateAccountApi(record.id);
        message.success(`Đã vô hiệu hóa tài khoản "${record.fullname}"`);
      } else {
        await activateAccountApi(record.id);
        message.success(`Đã kích hoạt tài khoản "${record.fullname}"`);
      }
      fetchStaff(pagination.current);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = (record) => {
    if (record.isActive) {
      message.warning('Vui lòng vô hiệu hóa tài khoản trước khi xóa!');
      return;
    }
    confirm({
      title: `Xóa tài khoản "${record.fullname}"?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Tài khoản sẽ bị xóa mềm và không thể đăng nhập nữa.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteAccountApi(record.id);
          message.success('Đã xóa tài khoản');
          fetchStaff(pagination.current);
        } catch (err) {
          message.error(err?.response?.data?.message || 'Xóa thất bại');
        }
      }
    });
  };

  const columns = [
    {
      title: 'STT',
      width: 60,
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1
    },
    {
      title: 'Tên đầy đủ',
      dataIndex: 'fullname',
      key: 'fullname',
      render: text => <span className="font-medium">{text}</span>
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: text => <span className="font-mono text-blue-600">{text}</span>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      render: val => val || <Text type="secondary">—</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: val => (
        <Tag color={val ? 'green' : 'red'}>{val ? 'Hoạt động' : 'Vô hiệu'}</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button
              icon={<PoweroffOutlined />}
              size="small"
              style={{ color: record.isActive ? '#ff7a00' : '#52c41a', borderColor: record.isActive ? '#ff7a00' : '#52c41a' }}
              onClick={() => handleToggleActive(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Cần vô hiệu hóa trước khi xóa' : 'Xóa mềm tài khoản'}>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.isActive}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý nhân viên</Title>
          <Text type="secondary">Danh sách tài khoản có vai trò STAFF</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { form.resetFields(); setIsModalOpen(true); }}
        >
          Thêm nhân viên
        </Button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm theo tên, email, username..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      <div className="bg-white rounded-lg shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={staffList}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: total => `Tổng ${total} nhân viên`,
            onChange: page => fetchStaff(page)
          }}
        />
      </div>

      {/* Modal Tạo Tài Khoản */}
      <Modal
        title="Tạo tài khoản nhân viên"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Vui lòng nhập username' }]}
          >
            <Input placeholder="dayla_username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password placeholder="123456" />
          </Form.Item>
          <Form.Item
            name="fullname"
            label="Tên đầy đủ"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="nhanvien@email.com" />
          </Form.Item>
          <Form.Item name="contactPhone" label="Số điện thoại">
            <Input placeholder="0777777777" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageStaffAccounts;
