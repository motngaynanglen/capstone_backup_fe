import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Layout as AntLayout, Tooltip, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const { Sider, Content } = AntLayout;

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất khỏi trang quản trị!');
    navigate('/admin/login');
  };

  // Menu items cho sidebar navigation
  const menuItems = [
    {
      path: '/admin',
      label: 'Tổng quan',
      icon: '📊'
    },
    {
      path: '/admin/users',
      label: 'Quản lý Tài khoản',
      icon: '👥'
    },
    {
      path: '/admin/orders',
      label: 'Quản lý Đơn hàng',
      icon: '📦'
    },
    {
      path: '/admin/products',
      label: 'Quản lý Sản phẩm',
      icon: '🛍️'
    },
    {
      path: '/admin/materials',
      label: 'Quản lý Vật liệu',
      icon: '🧱'
    },
    {
      path: '/admin/design-templates',
      label: 'Mẫu thiết kế',
      icon: '🎨'
    },
    {
      path: '/admin/shipments',
      label: 'Quản lý Vận đơn',
      icon: '🚚'
    },
    {
      path: '/admin/inventory',
      label: 'Quản lý Kho',
      icon: '📊'
    },
    {
      path: '/admin/services',
      label: 'Quản lý Dịch vụ',
      icon: '⚙️'
    },
    {
      path: '/admin/feedback',
      label: 'Phản hồi',
      icon: '💬'
    },
    {
      path: '/admin/settings',
      label: 'Cài đặt hệ thống',
      icon: '🔧'
    }
  ];

  const siderWidth = collapsed ? 80 : 260;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sider
        width={260}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 12px rgba(0, 0, 0, 0.08)',
          zIndex: 1000,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fe 100%)',
          borderRight: '1px solid #eef0f6'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Logo / Brand */}
        <div
          style={{
            padding: collapsed ? '20px 12px' : '24px 20px',
            borderBottom: '1px solid #eef0f6',
            textAlign: collapsed ? 'center' : 'left',
            transition: 'all 0.3s ease'
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              fontSize: collapsed ? '24px' : '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              transition: 'all 0.3s ease'
            }}>
              {collapsed ? '🖨️' : '3D Print Shop'}
            </div>
            {!collapsed && (
              <p style={{
                fontSize: '12px',
                color: '#8c8c8c',
                marginTop: '4px',
                marginBottom: 0,
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Dashboard
              </p>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <nav style={{ padding: collapsed ? '12px 8px' : '16px 12px' }}>
          {menuItems.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);

            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : '12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px' : '12px 16px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#4a5568',
                  boxShadow: isActive
                    ? '0 4px 12px rgba(102, 126, 234, 0.4)'
                    : 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '14px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f0f2ff';
                    e.currentTarget.style.color = '#667eea';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#4a5568';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span style={{
                  fontSize: collapsed ? '20px' : '18px',
                  lineHeight: 1,
                  flexShrink: 0
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.path} title={item.label} placement="right">
                {linkContent}
              </Tooltip>
            ) : (
              <React.Fragment key={item.path}>
                {linkContent}
              </React.Fragment>
            );
          })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div style={{
          flexShrink: 0,
          padding: collapsed ? '12px 8px' : '16px',
          borderTop: '1px solid #eef0f6',
          background: '#ffffff'
        }}>
          {!collapsed && (
            <div style={{
              marginBottom: '12px',
              padding: '0 8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#2d3748',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    {user?.fullName || user?.username}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: '#a0aec0',
                    margin: 0,
                    textTransform: 'capitalize'
                  }}>
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: collapsed ? '10px' : '10px 16px',
              textAlign: collapsed ? 'center' : 'left',
              color: '#e53e3e',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
        </div>
      </Sider>

      {/* Main Content Area with Outlet */}
      <AntLayout style={{
        marginLeft: siderWidth,
        minHeight: '100vh',
        background: '#f7f8fc',
        transition: 'margin-left 0.3s ease'
      }}>
        <Content style={{
          margin: '24px',
          overflow: 'initial'
        }}>
          <div style={{
            padding: '24px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            minHeight: 'calc(100vh - 48px)'
          }}>
            {/* Outlet renders child route components */}
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default DashboardLayout;
