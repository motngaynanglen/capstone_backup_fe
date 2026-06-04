import React, { useEffect } from 'react';
import { useAuthModal } from '../../contexts/AuthModalContext';

const RegisterPage = () => {
  const { openModal } = useAuthModal();

  useEffect(() => {
    openModal('register');
  }, [openModal]);

  return (
    <div className="py-16 text-center text-gray-500">
      Đang mở form đăng ký…
    </div>
  );
};

export default RegisterPage;
