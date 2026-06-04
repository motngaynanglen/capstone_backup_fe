import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, App, Spin } from 'antd';
import { UserOutlined, PhoneOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { getMyProfileApi, updateMyProfileApi, changePasswordApi } from '../../api/accountApi';

const UserProfilePage = () => {
    const { message } = App.useApp();

    // Quản lý trạng thái loading riêng biệt cho từng hành động
    const [initLoading, setInitLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

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

    // 2. Xử lý khi bấm Lưu Thông Tin
    const onUpdateProfile = async (values) => {
        setUpdateLoading(true);
        try {
            const result = await updateMyProfileApi({
                fullname: values.fullname,
                contactPhone: values.contactPhone
            });

            if (result.statusCode === 200 || result.code === 'SUCCESS') {
                message.success('Cập nhật thông tin cá nhân thành công!');
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
                        defaultActiveKey="1"
                        size="large"
                        items={[
                            { key: '1', label: 'Hồ sơ cá nhân', children: <ProfileTab /> },
                            { key: '2', label: 'Bảo mật & Mật khẩu', children: <PasswordTab /> },
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default UserProfilePage;