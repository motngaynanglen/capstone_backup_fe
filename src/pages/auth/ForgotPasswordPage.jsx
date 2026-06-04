import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography } from 'antd';

const ForgotPasswordPage = () => (
  <div className="max-w-md mx-auto py-12">
    <Card>
      <Typography.Title level={4}>Quên mật khẩu</Typography.Title>
      <Typography.Paragraph type="secondary">
        Tính năng đang được phát triển. Vui lòng liên hệ quản trị viên hoặc{' '}
        <Link to="/login">quay lại đăng nhập</Link>.
      </Typography.Paragraph>
    </Card>
  </div>
);

export default ForgotPasswordPage;
