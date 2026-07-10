import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Input, Button, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPostLoginPath } from '../../utils/authRedirect';

const AuthModal = () => {
  const { open, mode, setMode, closeModal } = useAuthModal();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const isLogin = mode === 'login';

  const handleClose = () => {
    form.resetFields();
    closeModal();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(values.username, values.password);
        if (result.success) {
          message.success('Đăng nhập thành công');
          handleClose();
          navigate(getPostLoginPath(result.user?.role));
        } else {
          message.error(result.message || 'Đăng nhập thất bại');
        }
      } else {
        const result = await register({
          username: values.username,
          password: values.password,
          fullName: values.fullName,
          email: values.email,
          contactPhone: values.contactPhone,
        });
        if (result.success) {
          message.success('Đăng ký thành công — vui lòng đăng nhập');
          setMode('login');
          form.resetFields();
        } else {
          message.error(result.message || 'Đăng ký thất bại');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={420}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        {!isLogin && (
          <>
            <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
              <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input prefix={<MailOutlined />} placeholder="email@example.com" />
            </Form.Item>
            <Form.Item name="contactPhone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="09xxxxxxxx" />
            </Form.Item>
          </>
        )}
        <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
          <Input prefix={<UserOutlined />} placeholder="username" autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block className="mt-2">
          {isLogin ? 'Đăng nhập' : 'Đăng ký'}
        </Button>
      </Form>
      <div className="text-center mt-4 text-sm text-gray-500">
        {isLogin ? (
          <>
            Chưa có tài khoản?{' '}
            <button type="button" className="text-indigo-600 font-medium cursor-pointer bg-transparent border-0" onClick={() => setMode('register')}>
              Đăng ký ngay
            </button>
          </>
        ) : (
          <>
            Đã có tài khoản?{' '}
            <button type="button" className="text-indigo-600 font-medium cursor-pointer bg-transparent border-0" onClick={() => setMode('login')}>
              Đăng nhập
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
