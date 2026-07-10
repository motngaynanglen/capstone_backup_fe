import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, App, Spin, Popconfirm, Empty, Tag } from 'antd';
import { UserOutlined, PhoneOutlined, LockOutlined, SafetyCertificateOutlined, EnvironmentOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMyProfileApi, updateMyProfileApi, changePasswordApi } from '../../api/accountApi';
import shippingAddressApi from '../../api/shippingAddressApi';
import { useAuth } from '../../contexts/AuthContext';

const UserProfilePage = () => {
    const { message } = App.useApp();
    const { updateUser } = useAuth();

    // Quản lý trạng thái loading riêng biệt cho từng hành động
    const [initLoading, setInitLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [deletingAddressId, setDeletingAddressId] = useState(null);
    const [activeTab, setActiveTab] = useState('1');

    // Khởi tạo 2 form riêng biệt cho 2 Tab
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // 1. Gọi API lấy thông tin ngay khi vào trang
    useEffect(() => {
        fetchMyProfile();
    }, []);

    const fetchMyProfile = async () => {
        try {
            const result = await getMyProfileApi();
            if (result.statusCode === 200 || result.code === 'SUCCESS') {
                // Đổ dữ liệu lấy được vào form Hồ sơ
                profileForm.setFieldsValue({
                    fullname: result.data?.fullname || '',
                    contactPhone: result.data?.contactPhone || '',
                    email: result.data?.email || '', // Hiển thị thêm cho đẹp dù không cho sửa
                    username: result.data?.username || ''
                });
            }
        } catch (error) {
            message.error('Không thể tải thông tin cá nhân lúc này.');
        } finally {
            setInitLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === '2') {
            fetchMyAddresses();
        }
    }, [activeTab]);

    const fetchMyAddresses = async () => {
        setAddressesLoading(true);
        try {
            const result = await shippingAddressApi.getMyAddresses();
            const list = result?.data || result || [];
            setAddresses(Array.isArray(list) ? list : []);
        } catch {
            message.error('Không thể tải danh sách địa chỉ.');
        } finally {
            setAddressesLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        setDeletingAddressId(addressId);
        try {
            const result = await shippingAddressApi.remove(addressId);
            if (result?.statusCode === 200 || result?.code === 'SUCCESS') {
                message.success('Đã xóa địa chỉ giao hàng.');
                setAddresses((prev) => prev.filter((a) => a.id !== addressId));
            } else {
                message.error(result?.message || 'Không thể xóa địa chỉ.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa địa chỉ.');
        } finally {
            setDeletingAddressId(null);
        }
    };

    const onUpdateProfile = async (values) => {
        setUpdateLoading(true);
        try {
            const result = await updateMyProfileApi({
                fullname: values.fullname,
                contactPhone: values.contactPhone
            });

            if (result.statusCode === 200 || result.code === 'SUCCESS') {
                message.success('Cập nhật thông tin cá nhân thành công!');
                updateUser({ fullName: values.fullname });
                fetchMyProfile(); // Tải lại dữ liệu cho chắc ăn
            } else {
                message.error(result.message || 'Cập nhật thất bại.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
        } finally {
            setUpdateLoading(false);
        }
    };

    // 3. Xử lý khi bấm Đổi Mật Khẩu
    const onChangePassword = async (values) => {
        setPasswordLoading(true);
        try {
            const result = await changePasswordApi({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
                confirmNewPassword: values.confirmNewPassword
            });

            if (result.statusCode === 200 || result.code === 'SUCCESS') {
                message.success('Đổi mật khẩu thành công!');
                passwordForm.resetFields(); // Xóa trắng form đổi pass sau khi đổi xong
            } else {
                message.error(result.message || 'Mật khẩu cũ không chính xác.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
        } finally {
            setPasswordLoading(false);
        }
    };

    // ==========================================
    // COMPONENT: TAB THÔNG TIN CÁ NHÂN
    // ==========================================
    const ProfileTab = () => (
        <Form form={profileForm} layout="vertical" onFinish={onUpdateProfile} size="large">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="username" label="Tên đăng nhập">
                    <Input prefix={<UserOutlined />} disabled className="bg-gray-100" />
                </Form.Item>
                <Form.Item name="email" label="Email đăng ký">
                    <Input disabled className="bg-gray-100" />
                </Form.Item>
            </div>

            <Form.Item
                name="fullname"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
                <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nhập họ và tên của bạn" />
            </Form.Item>

            <Form.Item
                name="contactPhone"
                label="Số điện thoại"
                rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
            >
                <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="Ví dụ: 0987654321" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={updateLoading} className="mt-4 bg-indigo-600 w-full md:w-auto px-8">
                LƯU THAY ĐỔI
            </Button>
        </Form>
    );

    const renderAddressTab = () => {
        if (addressesLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Spin tip="Đang tải địa chỉ..." />
                </div>
            );
        }

        if (addresses.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Bạn chưa có địa chỉ giao hàng nào được lưu."
                />
            );
        }

        return (
            <div className="space-y-3">
                {addresses.map((addr) => (
                    <div
                        key={addr.id}
                        className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50"
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <EnvironmentOutlined className="text-indigo-500 text-lg mt-0.5" />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900">{addr.receiverName}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-gray-600">{addr.phone}</span>
                                    {addr.isDefault && <Tag color="blue">Mặc định</Tag>}
                                </div>
                                <p className="text-sm text-gray-500 m-0">
                                    {[addr.addressLine, addr.ward, addr.district, addr.city, addr.province].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        </div>
                        <Popconfirm
                            title="Xóa địa chỉ này?"
                            description="Hành động này không thể hoàn tác."
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, loading: deletingAddressId === addr.id }}
                            onConfirm={() => handleDeleteAddress(addr.id)}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                loading={deletingAddressId === addr.id}
                            >
                                Xóa
                            </Button>
                        </Popconfirm>
                    </div>
                ))}
            </div>
        );
    };

    // ==========================================
    // COMPONENT: TAB ĐỔI MẬT KHẨU
    // ==========================================
    const PasswordTab = () => (
        <Form form={passwordForm} layout="vertical" onFinish={onChangePassword} size="large">
            <Form.Item
                name="oldPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
            >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập mật khẩu đang sử dụng" />
            </Form.Item>

            <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                ]}
                hasFeedback
            >
                <Input.Password prefix={<SafetyCertificateOutlined className="text-gray-400" />} placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item
                name="confirmNewPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    { required: true, message: 'Vui lòng xác nhận lại mật khẩu!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'));
                        },
                    }),
                ]}
            >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={passwordLoading} className="mt-4 bg-red-600 w-full md:w-auto px-8">
                CẬP NHẬT MẬT KHẨU
            </Button>
        </Form>
    );

    // ==========================================
    // RENDER GIAO DIỆN CHÍNH
    // ==========================================
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Tài khoản</h1>

            <Card className="shadow-md border-0 rounded-xl overflow-hidden">
                {initLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spin size="large" tip="Đang tải thông tin..." />
                    </div>
                ) : (
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        size="large"
                        items={[
                            { key: '1', label: 'Hồ sơ cá nhân', children: <ProfileTab /> },
                            { key: '2', label: 'Địa chỉ giao hàng', children: renderAddressTab() },
                            { key: '3', label: 'Bảo mật & Mật khẩu', children: <PasswordTab /> },
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default UserProfilePage;