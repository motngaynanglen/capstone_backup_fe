import React, { useEffect } from 'react';
import { useAuthModal } from '../../contexts/AuthModalContext';

const LoginPage = () => {
  const { openModal } = useAuthModal();

  useEffect(() => {
    openModal('login');
  }, [openModal]);

  return (
    <div className="py-16 text-center text-gray-500">
      Đang mở form đăng nhập…
    </div>
  );
};

export default LoginPage;
