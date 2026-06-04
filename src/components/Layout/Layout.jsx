import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Layout as AntLayout } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const { isManager, isAdmin, isEmployee, user } = useAuth();

  // Header và Footer luôn hiển thị khi component Layout được sử dụng
  // Các trang Manager/Admin đã có Layout riêng (ManagerLayout)


  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header />
      <AntLayout.Content style={{ width: '100%', padding: 0, margin: 0 }}>
        <div
          className="px-4 lg:px-6 py-6"
          style={{
            width: '100%',
            maxWidth: '88rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {children}
        </div>
      </AntLayout.Content>
      <Footer />
    </AntLayout>
  );
};

export default Layout;

