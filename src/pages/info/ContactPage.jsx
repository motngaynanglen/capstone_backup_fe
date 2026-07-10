import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Select, Button, message } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import InfoPageShell from '../../components/Common/InfoPageShell';

const { TextArea } = Input;

const CONTACT_INFO = [
  {
    icon: <PhoneOutlined className="text-indigo-600" />,
    label: 'Hotline',
    value: '1900 1234',
    href: 'tel:19001234',
  },
  {
    icon: <MailOutlined className="text-indigo-600" />,
    label: 'Email',
    value: 'contact@3dprintshop.com',
    href: 'mailto:contact@3dprintshop.com',
  },
  {
    icon: <EnvironmentOutlined className="text-indigo-600" />,
    label: 'Địa chỉ',
    value: '123 Đường Công Nghệ, Quận Cầu Giấy, Hà Nội',
  },
  {
    icon: <ClockCircleOutlined className="text-indigo-600" />,
    label: 'Giờ làm việc',
    value: 'Thứ 2 – Thứ 7: 8:00 – 18:00',
  },
];

const ContactPage = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async () => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      message.success('Đã gửi tin nhắn. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.');
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InfoPageShell
      title="Liên hệ"
      subtitle="Gửi câu hỏi về in 3D, báo giá custom hoặc hỗ trợ đơn hàng — đội ngũ sẽ phản hồi sớm nhất."
      wide
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm text-slate-600 m-0">
            Bạn cũng có thể xem{' '}
            <Link to="/faq" className="text-indigo-600 font-medium no-underline hover:underline">
              FAQ
            </Link>{' '}
            hoặc{' '}
            <Link to="/shipping" className="text-indigo-600 font-medium no-underline hover:underline">
              chính sách vận chuyển
            </Link>{' '}
            trước khi liên hệ.
          </p>

          <div className="space-y-4">
            {CONTACT_INFO.map((item) => (
              <div key={item.label} className="flex gap-3 items-start">
                <div className="mt-0.5 text-lg">{item.icon}</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 m-0">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium text-slate-900 no-underline hover:text-indigo-600"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-slate-900 m-0">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark="optional"
            className="[&_.ant-form-item-label>label]:font-medium"
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input placeholder="Nguyễn Văn A" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input placeholder="email@example.com" size="large" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input placeholder="09xx xxx xxx" size="large" />
            </Form.Item>

            <Form.Item
              name="topic"
              label="Chủ đề"
              rules={[{ required: true, message: 'Vui lòng chọn chủ đề' }]}
            >
              <Select
                placeholder="Chọn chủ đề"
                size="large"
                options={[
                  { value: 'quote', label: 'Báo giá in custom' },
                  { value: 'order', label: 'Hỗ trợ đơn hàng' },
                  { value: 'shipping', label: 'Vận chuyển & giao hàng' },
                  { value: 'technical', label: 'Tư vấn file / kỹ thuật' },
                  { value: 'other', label: 'Khác' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="message"
              label="Nội dung"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
            >
              <TextArea
                rows={5}
                placeholder="Mô tả yêu cầu hoặc câu hỏi của bạn..."
                showCount
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button type="primary" htmlType="submit" size="large" loading={submitting} block>
                Gửi tin nhắn
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </InfoPageShell>
  );
};

export default ContactPage;
