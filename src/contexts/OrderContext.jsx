import React, { createContext, useContext, useMemo } from 'react';

const OrderContext = createContext(null);

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return ctx;
};

/** Giữ provider để App.jsx mount được; mở rộng khi cần state đơn hàng global. */
export const OrderProvider = ({ children }) => {
  const value = useMemo(() => ({}), []);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
