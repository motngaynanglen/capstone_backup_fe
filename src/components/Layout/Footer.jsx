import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Space, Typography } from 'antd';

const Footer = () => {
  return (
    <Layout.Footer style={{ padding: 0, background: '#0f172a' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Typography.Title level={4} style={{ marginTop: 0, color: '#fff' }}>
            3D Print Shop
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
            Nền tảng in 3D chuyên nghiệp cho cá nhân và doanh nghiệp. Nhận thiết kế, in ấn,
            gia công hoàn thiện và giao hàng toàn quốc.
          </Typography.Paragraph>
        </div>

        <div>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
            Sản phẩm & dịch vụ
          </Typography.Text>
          <div className="mt-3 space-y-2 text-sm">
            <Link className="block text-slate-300 no-underline hover:text-white" to="/products">
              Sản phẩm in sẵn
            </Link>
            <Link className="block text-slate-300 no-underline hover:text-white" to="/custom-order">
              Đặt in theo yêu cầu
            </Link>
            <Link className="block text-slate-300 no-underline hover:text-white" to="/preview/1">
              Xem trước mô hình 3D
            </Link>
          </div>
        </div>

        <div>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
            Hỗ trợ khách hàng
          </Typography.Text>
          <div className="mt-3 space-y-2 text-sm">
            <Link className="block text-slate-300 no-underline hover:text-white" to="/faq">
              Câu hỏi thường gặp
            </Link>
            <Link className="block text-slate-300 no-underline hover:text-white" to="/shipping">
              Chính sách vận chuyển
            </Link>
            <Link className="block text-slate-300 no-underline hover:text-white" to="/contact">
              Liên hệ
            </Link>
          </div>
        </div>

        <div>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
            Kết nối với chúng tôi
          </Typography.Text>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.65)', marginTop: 12 }}>
            Hotline: <span className="font-semibold text-amber-300">1900 1234</span>
          </Typography.Paragraph>
          <Space size={12} wrap>
            <a className="text-slate-300 no-underline hover:text-white" href="#" aria-label="Facebook">
              Facebook
            </a>
            <a className="text-slate-300 no-underline hover:text-white" href="#" aria-label="Zalo">
              Zalo
            </a>
            <a className="text-slate-300 no-underline hover:text-white" href="#" aria-label="YouTube">
              YouTube
            </a>
          </Space>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="m-0">&copy; {new Date().getFullYear()} 3D Print Shop. All rights reserved.</p>
          <p className="m-0">
            Powered by <span className="font-semibold text-slate-200">3D Print Platform</span>
          </p>
        </div>
      </div>
    </Layout.Footer>
  );
};

export default Footer;

