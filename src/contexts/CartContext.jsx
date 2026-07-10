import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CART_STORAGE_KEY = 'real_fe_cart';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((item) => {
              const qty = Number(item.quantity);
              return {
                ...item,
                quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
                product: item.product
                  ? {
                      ...item.product,
                      price: Number(item.product.price) || 0,
                    }
                  : item.product,
              };
            })
          );
        }
      }
    } catch (error) {
      console.error('Không đọc được giỏ hàng từ localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Không lưu giỏ hàng:', error);
    }
  }, [items]);

  const removeFromCart = useCallback((productId, material) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product?.id === productId && i.material === material))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId, material, quantity) => {
      if (quantity < 1) {
        removeFromCart(productId, material);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product?.id === productId && i.material === material
            ? { ...i, quantity }
            : i
        )
      );
    },
    [removeFromCart]
  );

  const addToCart = useCallback((product, material = 'PLA', quantity = 1) => {
    if (!product) return;
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product?.id === product.id && i.material === material
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: (next[idx].quantity || 0) + quantity,
        };
        return next;
      }
      return [...prev, { product, material, quantity }];
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const price = Number(i.product?.price) || 0;
        const qty = Number(i.quantity);
        return sum + price * (Number.isFinite(qty) && qty > 0 ? qty : 1);
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [items, totalItems, subtotal, addToCart, updateQuantity, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
