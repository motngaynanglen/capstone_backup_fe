export const VNPAY_CHECKOUT_SESSION_KEY = 'real_fe_vnpay_checkout_pending';

export const saveVnPayCheckoutPending = (payload) => {
  try {
    sessionStorage.setItem(VNPAY_CHECKOUT_SESSION_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Không lưu được phiên checkout VNPay:', error);
  }
};

export const loadVnPayCheckoutPending = () => {
  try {
    const raw = sessionStorage.getItem(VNPAY_CHECKOUT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.orderId) {
      return null;
    }
    if (!Array.isArray(parsed.cartItems)) {
      parsed.cartItems = [];
    }
    return parsed;
  } catch (error) {
    console.error('Không đọc được phiên checkout VNPay:', error);
    return null;
  }
};

export const clearVnPayCheckoutPending = () => {
  try {
    sessionStorage.removeItem(VNPAY_CHECKOUT_SESSION_KEY);
  } catch (error) {
    console.error('Không xóa được phiên checkout VNPay:', error);
  }
};
