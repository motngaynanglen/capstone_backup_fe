import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthModalContext = createContext(null);

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
};

export const AuthModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');

  const openModal = useCallback((nextMode = 'login') => {
    setMode(nextMode === 'register' ? 'register' : 'login');
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, mode, setMode, openModal, closeModal }),
    [open, mode, openModal, closeModal]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};
