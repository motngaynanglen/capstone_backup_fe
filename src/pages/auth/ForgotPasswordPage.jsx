import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App, Card, Input, Button, Form, Steps } from 'antd';
import { MailOutlined, KeyOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { requestForgotPasswordApi } from '../../api/authApi';

const isSuccess = (res) =>
  res?.statusCode === 200 || res?.code === 'SUCCESS' || res?.data === true;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0 = nhập email, 1 = nhập mã
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);

  // Bước 1: gửi mã đặt lại mật khẩu về email
  const handleSendCode = async () => {
    const e = email.trim();
    if (!e) { message.warning('Vui lòng nhập email'); return; }
    if (!EMAIL_RE.test(e)) { message.warning('Email không hợp lệ'); return; }
    setSending(true);
    try {
      const res = await requestForgotPasswordApi(e);
      if (isSuccess(res)) {
        message.success('Đã gửi mã đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả mục Spam)!');
        setStep(1);
      } else {
        message.error(res?.message || 'Không gửi được mã. Vui lòng thử lại.');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Email không tồn tại trong hệ thống hoặc lỗi kết nối.');
    } finally {
      setSending(false);
    }
  };

  // Bước 2: xác nhận mã rồi chuyển sang trang đặt lại mật khẩu.
  // BE không có API kiểm tra mã riêng — mã (token) sẽ được kiểm tra khi đặt lại mật khẩu.
  const handleConfirmCode = () => {
    const c = code.trim();
    if (!c) { message.warning('Vui lòng nhập mã đã nhận trong email'); return; }
    navigate(
      `/reset-password?email=${encodeURIComponent(email.trim())}&token=${encodeURIComponent(c)}`,
    );
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 p-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailOutlined className="text-2xl text-indigo-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Quên mật khẩu</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Lấy lại mật khẩu qua email đăng ký của bạn.
          </p>
        </div>

        <Steps
          size="small"
          current={step}
          className="mb-6"
          items={[
            { title: 'Nhập email' },
            { title: 'Nhập mã' },
          ]}
        />

        {step === 0 ? (
          <Form layout="vertical" size="large" onFinish={handleSendCode}>
            <Form.Item>
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Email đăng ký"
                className="h-12 rounded-lg"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              className="w-full h-12 rounded-lg font-semibold text-base"
              loading={sending}
            >
              {sending ? 'ĐANG GỬI...' : 'GỬI MÃ VỀ EMAIL'}
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" size="large" onFinish={handleConfirmCode}>
            <p className="text-sm text-gray-500 mb-3 text-center">
              Mã đặt lại mật khẩu đã được gửi tới <b>{email}</b>.
              Nhập mã trong email để tiếp tục.
            </p>
            <Form.Item>
              <Input
                prefix={<KeyOutlined className="text-gray-400" />}
                placeholder="Mã đặt lại mật khẩu (Token)"
                className="h-12 rounded-lg font-mono text-sm"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 rounded-lg font-semibold text-base"
            >
              XÁC NHẬN & ĐẶT LẠI MẬT KHẨU
            </Button>
            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                ← Đổi email
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sending}
                className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                Gửi lại mã
              </button>
            </div>
          </Form>
        )}

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="text-gray-600 hover:text-indigo-600 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
