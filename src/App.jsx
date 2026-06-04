import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <AuthModalProvider>
            <AppRouter />
          </AuthModalProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

