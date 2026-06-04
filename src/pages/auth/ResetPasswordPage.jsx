import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { App, Card, Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { resetPasswordApi } from '../../api/authApi';

const ResetPasswordPage = () => {
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    // Lấy username hoặc email từ URL (nếu có)
    const defaultUsername = searchParams.get('username') || searchParams.get('email') || '';

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Khớp 100% với body JSON bạn vừa cung cấp
            const result = await resetPasswordApi({
                username: values.username,
                token: values.token,
                newPassword: values.newPassword
            });

            if (result.statusCode === 200 || result.code === 'SUCCESS') {
                message.success('Chúc mừng! Đặt lại mật khẩu thành công.');
                navigate('/login');
            } else {
                message.error(result.message || 'Mã Token không hợp lệ hoặc đã hết hạn.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 p-4 py-12">
            <Card className="w-full max-w-md shadow-xl border-0 rounded-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockOutlined className="text-2xl text-green-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-800">Tạo mật khẩu mới</h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        Vui lòng nhập Tên đăng nhập, mã Token từ email và mật khẩu mới của bạn.
                    </p>
                </div>

                <Form
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    initialValues={{ username: defaultUsername }}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập Tên đăng nhập!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Tên đăng nhập (Username)"
                            className="h-12 rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item
                        name="token"
                        rules={[{ required: true, message: 'Vui lòng nhập mã Token!' }]}
                    >
                        <Input
                            prefix={<KeyOutlined className="text-gray-400" />}
                            placeholder="Mã Token (Lấy từ Email)"
                            className="h-12 rounded-lg font-mono text-sm"
                        />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Mật khẩu mới"
                            className="h-12 rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
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
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Nhập lại mật khẩu mới"
                            className="h-12 rounded-lg"
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-lg font-semibold text-base mt-2 transition-all"
                        loading={loading}
                    >
                        {loading ? 'ĐANG CẬP NHẬT...' : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
                    </Button>
                </Form>

                <div className="text-center mt-8">
                    <Link to="/login" className="text-gray-600 hover:text-green-600 font-medium flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeftOutlined /> Hủy và quay lại đăng nhập
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;