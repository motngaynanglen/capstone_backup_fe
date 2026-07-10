import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Grid, Input, Layout, Menu, Space, Typography, Dropdown, Avatar } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, UserOutlined, DownOutlined, UnorderedListOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';

import { useCart } from '../../contexts/CartContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { openModal } = useAuthModal();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [q, setQ] = useState('');
// ... (skip lines to reach badge)
// Thay vì dùng `0`, dùng `totalItems`
// Tôi sẽ tìm function header ở StartLine 8 và render ở dưới


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/products')) return 'products';
    if (location.pathname.startsWith('/custom-order')) return 'custom';
    if (location.pathname.startsWith('/my-orders')) return 'orders';
    if (location.pathname.startsWith('/staff')) return 'staff';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'home';
  }, [location.pathname]);

  const onSearch = (value) => {
    const term = (value ?? '').trim();
    setQ(term);
    navigate(`/products${term ? `?q=${encodeURIComponent(term)}` : ''}`);
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Thông tin tài khoản</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'orders',
      icon: <UnorderedListOutlined />,
      label: <Link to="/my-orders">Đơn hàng của tôi</Link>,
    },
    {
      key: 'custom-orders',
      icon: <FileTextOutlined />,
      label: <Link to="/my-custom-orders">Đơn hàng Custom</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout.Header style={{ padding: 0, height: 'auto', lineHeight: 'normal' }}>
      {/* Top info bar */}
      <div className="bg-slate-900 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center justify-between">
          <Space size={10} wrap>
            <Typography.Text style={{ color: '#fff', fontWeight: 700 }}>
              3D Print Shop
            </Typography.Text>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.65)' }} className="hidden md:inline">
              Biến ý tưởng của bạn thành sản phẩm 3D thực tế
            </Typography.Text>
          </Space>
          <Space size={16} wrap>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.7)' }}>
              Email: contact@3dprintshop.com
            </Typography.Text>
            <Typography.Text style={{ color: '#fbbf24', fontWeight: 700 }}>
              Hotline: 1900 1234
            </Typography.Text>
          </Space>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <Link to="/" className="no-underline">
            <Space size={10} align="center">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                3D
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-900 text-lg">3D Print Shop</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Custom 3D Printing</div>
              </div>
            </Space>
          </Link>

          <div className="flex-1 md:px-6">
            <Input.Search
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onSearch={onSearch}
              placeholder="Tìm sản phẩm in 3D, vật liệu, phụ kiện..."
              allowClear
              enterButton={
                <Button type="primary" icon={<SearchOutlined />}>
                  {screens.sm ? 'Tìm kiếm' : ''}
                </Button>
              }
              size="large"
            />
          </div>

          <Space size={12} align="center" wrap style={{ justifyContent: 'flex-end' }}>
            <Badge count={totalItems} size="small" showZero={false}>
              <Button
                type="default"
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/cart')}
              >
                {screens.sm ? 'Giỏ hàng' : ''}
              </Button>
            </Badge>

            {isAuthenticated ? (
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <Button type="text" className="flex items-center gap-2 hover:bg-slate-100">
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }} />
                  <span className="font-medium text-slate-700 hidden sm:inline">
                    {user?.fullName || user?.username || 'Khách hàng'}
                  </span>
                  <DownOutlined className="text-xs text-slate-400" />
                </Button>
              </Dropdown>
            ) : (
              <Space size={8} align="center">
                <Button icon={<UserOutlined />} onClick={() => openModal('login')}>
                  Đăng nhập
                </Button>
                <Button type="primary" onClick={() => openModal('register')}>
                  Đăng ký
                </Button>
              </Space>
            )}
          </Space>
        </div>
      </div>

    </Layout.Header>
  );
};

export default Header;

