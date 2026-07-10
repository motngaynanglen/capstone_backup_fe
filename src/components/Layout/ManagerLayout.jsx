import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const { Sider, Content } = AntLayout;

const ManagerLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất khỏi trang quản lý!');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      path: '/manager/dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      path: '/manager/products',
      label: 'Quản lý sản phẩm',
      icon: '📦'
    },
    {
      path: '/manager/materials',
      label: 'Quản lý vật liệu in',
      icon: '🧱'
    },
    {
      path: '/manager/staff',
      label: 'Quản lý nhân viên',
      icon: '👥'
    },
    {
      path: '/manager/feedback',
      label: 'Quản lý phản hồi',
      icon: '💬'
    },
    {
      path: '/manager/inventory',
      label: 'Quản lý kho',
      icon: '🏭'
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        theme="light"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          <div className="p-6 border-b border-gray-200 shrink-0">
            <Link to="/" className="no-underline">
              <h1 className="text-xl font-bold text-gray-800">3D Print Shop</h1>
              <p className="text-sm text-gray-600 mt-1">Trang Quản Lý</p>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
          {menuItems.map((item) => {
            const isActive = item.path === '/manager/dashboard'
              ? location.pathname === '/manager/dashboard'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors no-underline ${isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
            </nav>
          </div>
          <div className="shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-800">{user?.fullName || user?.username}</p>
            <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Đăng xuất
            </button>
          </div>
        </div>
      </Sider>
      <AntLayout style={{ marginLeft: 250, minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div className="px-4 py-6 pb-20">
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default ManagerLayout;

