import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, App, Tooltip, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, PhoneOutlined, SearchOutlined } from '@ant-design/icons';
import {
  queryAccountsApi, createAccountApi, getAccountDetailApi,
  updateAccountApi, activateAccountApi, deactivateAccountApi, deleteAccountApi
} from '../../api/accountApi';

const ManageUsers = () => {
  const { message } = App.useApp();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // THÊM 2 STATE ĐỂ LƯU TỪ KHÓA TÌM KIẾM VÀ LỌC
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form] = Form.useForm();

  // ==========================================
  // 1. LẤY DANH SÁCH (CÓ KÈM TÌM KIẾM & LỌC)
  // ==========================================
  useEffect(() => {
    fetchUsers(1, pagination.pageSize, searchText, filterRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  // Nhận thêm biến searchKeyword và role để truyền xuống API
  const fetchUsers = async (pageNumber = 1, pageSize = 10, searchKeyword = "", role = "") => {
    setLoading(true);
    try {
      const payload = {
        role: role,
        search: searchKeyword,
        sortBy: "Name",
        sortDescending: true,
        includeDeleted: false,
        paging: {
          pageNumber: pageNumber,
          pageSize: pageSize
        }
      };

      const result = await queryAccountsApi(payload);

      setUsers(result.data?.items || result.data || []);
      setPagination({
        current: pageNumber,
        pageSize: pageSize,
        total: result.data?.total || 0
      });
    } catch (error) {
      message.error('Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  // Bắt sự kiện chuyển trang của Table
  const handleTableChange = (newPagination) => {
    fetchUsers(newPagination.current, newPagination.pageSize, searchText, filterRole);
  };

  // Bắt sự kiện Gõ enter hoặc bấm nút Tìm kiếm
  const handleSearch = (value) => {
    setSearchText(value);
    // Khi tìm kiếm luôn reset về trang 1
    fetchUsers(1, pagination.pageSize, value, filterRole);
  };

  // Bắt sự kiện Chọn filter Quyền
  const handleFilterRoleChange = (value) => {
    setFilterRole(value);
    // Khi đổi bộ lọc cũng reset về trang 1
    fetchUsers(1, pagination.pageSize, searchText, value);
  };

  // ==========================================
  // 2. XỬ LÝ MODAL THÊM / SỬA (Giữ nguyên)
  // ==========================================
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ role: 'CUSTOMER', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (id) => {
    setModalMode('edit');
    setEditingId(id);
    setIsModalOpen(true);

    try {
      const result = await getAccountDetailApi(id);
      if (result.data) {
        form.setFieldsValue({
          username: result.data.username,
          fullname: result.data.fullname,
          email: result.data.email,
          contactPhone: result.data.contactPhone,
          isActive: result.data.isActive,
        });
      }
    } catch (error) {
      message.error('Lỗi khi lấy thông tin chi tiết!');
      setIsModalOpen(false);
    }
  };

  const handleSubmitForm = async (values) => {
    setSubmitLoading(true);
    try {
      if (modalMode === 'add') {
        const payloadAdd = {
          username: values.username,
          password: values.password,
          fullname: values.fullname,
          email: values.email,
          contactPhone: values.contactPhone,
          role: values.role
        };
        await createAccountApi(payloadAdd);
        message.success('Tạo tài khoản mới thành công!');
      } else {
        const payloadUpdate = {
          fullname: values.fullname,
          email: values.email,
          contactPhone: values.contactPhone,
          isActive: values.isActive
        };
        if (values.password) {
          payloadUpdate.password = values.password;
        }

        await updateAccountApi(editingId, payloadUpdate);
        message.success('Cập nhật tài khoản thành công!');
      }

      setIsModalOpen(false);
      // Refresh lại data giữ nguyên keyword tìm kiếm hiện tại
      fetchUsers(pagination.current, pagination.pageSize, searchText, filterRole);
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================================
  // 3. XỬ LÝ XÓA, KHÓA, MỞ KHÓA TỪ BẢNG (Giữ nguyên)
  // ==========================================
  const handleDelete = async (id) => {
    try {
      await deleteAccountApi(id);
      message.success('Đã xóa mềm tài khoản!');
      fetchUsers(pagination.current, pagination.pageSize, searchText, filterRole);
    } catch (error) {
      message.error('Lỗi khi xóa tài khoản.');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await deactivateAccountApi(id);
        message.success('Đã tạm ngưng tài khoản!');
      } else {
        await activateAccountApi(id);
        message.success('Đã kích hoạt tài khoản!');
      }
      fetchUsers(pagination.current, pagination.pageSize, searchText, filterRole);
    } catch (error) {
      message.error('Thao tác thất bại.');
    }
  };

  // ==========================================
  // UI: COLUMNS BẢNG
  // ==========================================
  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', fontWeight: 'bold' },
    { title: 'Họ và tên', dataIndex: 'fullname', key: 'fullname' },
    { title: 'SĐT', dataIndex: 'contactPhone', key: 'contactPhone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Quyền',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'red' : role === 'STAFF' ? 'blue' : 'green'}>
          {role || 'CUSTOMER'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? 'Hoạt động' : 'Tạm ngưng'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={record.isActive ? "Tạm ngưng" : "Kích hoạt"}>
            <Switch
              checked={record.isActive}
              onChange={() => handleToggleActive(record.id, record.isActive)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => handleOpenEdit(record.id)} />
          </Tooltip>
          <Popconfirm title="Xóa tài khoản?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Tooltip title="Xóa mềm">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h1>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleOpenAdd}>
          Thêm tài khoản
        </Button>
      </div>

      <Card className="shadow-sm rounded-lg border-0">
        {/* ================= THÊM THANH TÌM KIẾM VÀ LỌC ================= */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input.Search
            placeholder="Tìm kiếm theo tên, username..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="max-w-md"
          />

          <Select
            defaultValue=""
            size="large"
            className="w-48"
            onChange={handleFilterRoleChange}
            options={[
              { value: '', label: 'Tất cả phân quyền' },
              { value: 'CUSTOMER', label: 'Khách hàng' },
              { value: 'STAFF', label: 'Nhân viên' },
              { value: 'ADMIN', label: 'Quản trị viên' },
            ]}
          />
        </div>
        {/* ============================================================= */}

        <Table
          columns={columns}
          dataSource={users}
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

      <Modal
        title={modalMode === 'add' ? 'Thêm Tài Khoản Mới' : 'Cập Nhật Tài Khoản'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
              <Input disabled={modalMode === 'edit'} placeholder="Ví dụ: phuoc123" />
            </Form.Item>

            <Form.Item
              name="password"
              label={modalMode === 'add' ? "Mật khẩu" : "Đổi mật khẩu (bỏ trống nếu giữ nguyên)"}
              rules={modalMode === 'add' ? [{ required: true, message: 'Nhập mật khẩu!' }] : []}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          </div>

          <Form.Item name="fullname" label="Họ và tên" rules={[{ required: true }]}>
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Email" />
            </Form.Item>

            <Form.Item name="contactPhone" label="Số điện thoại" rules={[{ required: true }]}>
              <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="0777777777" />
            </Form.Item>
          </div>

          {modalMode === 'add' && (
            <Form.Item name="role" label="Phân quyền" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="CUSTOMER">Khách hàng (Customer)</Select.Option>
                <Select.Option value="STAFF">Nhân viên (Staff)</Select.Option>
                <Select.Option value="ADMIN">Quản trị viên (Admin)</Select.Option>
              </Select>
            </Form.Item>
          )}

          {modalMode === 'edit' && (
            <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
              <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Tạm ngưng" />
            </Form.Item>
          )}

          <div className="flex justify-end mt-6 gap-2">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              {modalMode === 'add' ? 'Tạo mới' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageUsers;