import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import shippingAddressApi from '../api/shippingAddressApi';
import { performTransactionApi, checkoutOrderApi } from '../api/orderApi';
import { isCustomPrintSourceType, isDirectPrintSourceType } from '../api/mainflow2Api';
import { useCart } from '../contexts/CartContext';
import { getPreOrderQuantity, needsAdditionalPrinting } from '../utils/catalogProduct';
import {
  clearVnPayCheckoutPending,
  loadVnPayCheckoutPending,
  saveVnPayCheckoutPending,
} from '../utils/vnpayCheckoutSession';
import { resolveMainflow2ChatPath } from '../utils/mainflow2ReturnPath';
import {
  isValidVietnamesePhone,
  normalizeVietnamesePhone,
  VIETNAMESE_PHONE_ERROR,
} from '../utils/phoneValidation';
import { Modal, notification } from 'antd';
import ShippingCarrierSelect from '../components/Shipping/ShippingCarrierSelect';
import GhnLocationPicker from '../components/Shipping/GhnLocationPicker';

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const PAYMENT_METHODS = [
  { value: 'VNPAY', label: 'VNPay Sandbox', description: 'Thẻ / ví / QR qua cổng VNPay (môi trường thử nghiệm)' },
  { value: 'CASH', label: 'Thanh toán trực tiếp (COD)', description: 'Thanh toán khi nhận hàng' },
];

const DEFAULT_SHIPPING_FEE = 30000;
const CUSTOM_DEPOSIT_PERCENT = 30;

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const hasGhnCodes = (addr) =>
  Boolean(addr?.ghnDistrictId > 0 && String(addr?.ghnWardCode || '').trim());

/** BE tự map từ ward/district/city nếu thiếu mã GHN. */
const hasAddressTextForGhn = (addr) =>
  Boolean(addr?.ward?.trim() && (addr?.district?.trim() || addr?.city?.trim()));

const buildCartItemsFromLocationState = (state) => {
  const st = state || {};
  if (Array.isArray(st.cartItems) && st.cartItems.length > 0) {
    return st.cartItems;
  }
  if (st.designWorkId) {
    return [{
      designWorkId: st.designWorkId,
      sourceType: st.designWorkSourceType || 'CUSTOM_QUOTE_MF2',
      name: st.designWorkName || 'Sản phẩm thiết kế theo yêu cầu',
      price: st.designWorkPrice || 0,
      designWorkDesignFee: st.designWorkDesignFee ?? 0,
      quantity: 1,
      material: st.material || 'PLA',
    }];
  }
  if (st.product) {
    const product = st.product;
    const sourceType = st.sourceType || 'IN_STOCK';
    const isCustom = sourceType === 'CUSTOM_QUOTE_MF2' || sourceType === 'CUSTOM_FILE_PRINT_MF2' || sourceType === 'AI_GENERATED';
    return [{
      variantId: isCustom ? undefined : product.id,
      designWorkId: isCustom ? product.id : undefined,
      name: product.name,
      designTemplateName: product.designTemplateName,
      price: (sourceType === 'CUSTOM_QUOTE_MF2' ? product.latestQuotedPrice : product.price) || 0,
      quantity: st.quantity || 1,
      material: st.material || product.material || 'PLA',
      modelSrc: product.modelSrc,
      sourceType,
    }];
  }
  return [];
};

/** BE yêu cầu Guid dạng chuỗi — không gửi number (lỗi 400 binding). */
const toGuidString = (value, label = 'ID') => {
  if (value == null || value === '') return undefined;
  const s = String(value).trim();
  if (!GUID_RE.test(s)) {
    throw new Error(
      `${label} không hợp lệ. Vui lòng xóa giỏ hàng cũ, chọn lại sản phẩm từ Cửa hàng rồi đặt hàng.`
    );
  }
  return s;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clearCart } = useCart();

  const pendingVnPaySession = useMemo(() => {
    const fromState = buildCartItemsFromLocationState(location.state);
    if (fromState.length > 0) return null;
    return loadVnPayCheckoutPending();
  }, [location.state]);

  // 3 chế độ vào checkout:
  // (A) state.cartItems  → mảng item từ ProductCatalog "Mua ngay" hoặc ShoppingCart "Tiến hành thanh toán"
  // (B) state.designWorkId + designWorkSourceType (CUSTOM_FILE_PRINT_MF2 / CUSTOM_QUOTE_MF2 / AI_GENERATED) → từ /custom-orders/:id sau khi APPROVED
  // (C) legacy single product (state.product, state.quantity, state.material, state.sourceType)
  // (D) quay lại từ cổng VNPay → khôi phục từ sessionStorage
  const initialCartItems = useMemo(() => {
    const fromState = buildCartItemsFromLocationState(location.state);
    if (fromState.length > 0) return fromState;
    return pendingVnPaySession?.cartItems || [];
  }, [location.state, pendingVnPaySession]);

  const [cartItems] = useState(initialCartItems);
  const [pendingOrderId] = useState(pendingVnPaySession?.orderId || null);
  const [pendingOrderCode] = useState(pendingVnPaySession?.orderCode || null);
  const isPendingVnPayCheckout = Boolean(pendingOrderId);

  const [addressMode, setAddressMode] = useState('existing');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [ghnLocation, setGhnLocation] = useState({
    provinceId: null,
    provinceName: '',
    districtId: null,
    districtName: '',
    wardCode: '',
    wardName: '',
  });
  const [formData, setFormData] = useState({
    receiverName: '',
    phone: '',
    addressLine: '',
    ward: '',
    district: '',
    city: '',
    province: 'Việt Nam',
    isDefault: false,
    note: '',
    paymentMethod: pendingVnPaySession?.paymentMethod || 'CASH',
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingQuoteReady, setShippingQuoteReady] = useState(false);

  const subtotal = cartItems.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 1), 0);
  const preOrderLines = cartItems.filter((it) =>
    needsAdditionalPrinting(it.quantity, it.stock, it.isAllowPreOrder)
  );
  const hasPreOrderItems = preOrderLines.length > 0;
  /** Đã chọn GHN → dùng đúng phí API (kể cả 0đ). Chưa báo giá → phí mặc định 30k. */
  const effectiveShippingFee = shippingQuoteReady
    ? Number(shippingFee) || 0
    : DEFAULT_SHIPPING_FEE;
  const total = subtotal + (cartItems.length > 0 ? effectiveShippingFee : 0);
  const isDirectPrintCheckout =
    cartItems.some((it) => isDirectPrintSourceType(it.sourceType))
    || isDirectPrintSourceType(location.state?.designWorkSourceType);
  const isCustomDepositCheckout = !isDirectPrintCheckout && cartItems.some(
    (it) => it.designWorkId || isCustomPrintSourceType(it.sourceType),
  );
  const designFeeAmount = isCustomDepositCheckout
    ? Math.max(
        0,
        Number(
          location.state?.designWorkDesignFee
          ?? cartItems.find((it) => it.designWorkDesignFee != null)?.designWorkDesignFee
          ?? 0,
        ) || 0,
      )
    : 0;
  const depositBase = designFeeAmount > 0 ? designFeeAmount : total;
  const depositAmount = isCustomDepositCheckout
    ? Math.round(depositBase * CUSTOM_DEPOSIT_PERCENT / 100)
    : total;
  const balanceAfterDeposit = isCustomDepositCheckout ? Math.max(0, total - depositAmount) : 0;
  const paymentPhase = isCustomDepositCheckout ? 'DEPOSIT' : 'FULL';
  const availablePaymentMethods = isCustomDepositCheckout
    ? PAYMENT_METHODS.filter((m) => m.value === 'VNPAY')
    : PAYMENT_METHODS;
  const quoteAddressId = addressMode === 'existing' ? selectedAddressId : null;
  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const selectedAddressHasGhn = hasGhnCodes(selectedAddress);
  const newAddressGhnReady =
    addressMode === 'new' && ghnLocation.districtId > 0 && Boolean(ghnLocation.wardCode?.trim());
  const existingAddressReady =
    addressMode === 'existing' && selectedAddressId
    && (selectedAddressHasGhn || hasAddressTextForGhn(selectedAddress));
  const shippingGhnReady = addressMode === 'new' ? newAddressGhnReady : existingAddressReady;
  const collectOnDelivery = formData.paymentMethod === 'CASH';
  const phoneValid = isValidVietnamesePhone(formData.phone);
  const phoneError = phoneTouched && formData.phone && !phoneValid ? VIETNAMESE_PHONE_ERROR : '';
  const newAddressFormReady =
    Boolean(formData.receiverName?.trim())
    && phoneValid
    && Boolean(formData.addressLine?.trim())
    && newAddressGhnReady
    && shippingQuoteReady;

  const handleShippingChange = useCallback((carrier, fee) => {
    setShippingCarrier(carrier);
    setShippingFee(Number(fee) || 0);
    setShippingQuoteReady(Boolean(carrier));
  }, []);

  useEffect(() => {
    if (addressMode === 'new') return;
    setGhnLocation({
      provinceId: null,
      provinceName: '',
      districtId: null,
      districtName: '',
      wardCode: '',
      wardName: '',
    });
  }, [addressMode]);

  useEffect(() => {
    if (addressMode !== 'existing') return;
    setShippingCarrier('');
    setShippingFee(0);
    setShippingQuoteReady(false);
  }, [addressMode, quoteAddressId]);

  useEffect(() => {
    if (addressMode !== 'new') return;
    setShippingCarrier('');
    setShippingFee(0);
    setShippingQuoteReady(false);
  }, [addressMode, ghnLocation.districtId, ghnLocation.wardCode]);

  useEffect(() => {
    if (buildCartItemsFromLocationState(location.state).length > 0) {
      clearVnPayCheckoutPending();
    }
  }, [location.state]);

  useEffect(() => {
    if (searchParams.get('payFailed') !== '1') return;
    const message = searchParams.get('message') || 'Thanh toán VNPay chưa hoàn tất.';
    notification.warning({
      message: 'Thanh toán chưa hoàn tất',
      description: message,
      placement: 'topRight',
      duration: 6,
    });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isPendingVnPayCheckout) return;
    notification.info({
      message: 'Đơn hàng chưa thanh toán',
      description: pendingOrderCode
        ? `Mã đơn ${pendingOrderCode}. Bạn có thể chọn lại VNPay và thanh toán tiếp.`
        : 'Bạn đã quay lại từ cổng VNPay. Vui lòng hoàn tất thanh toán.',
      placement: 'topRight',
      duration: 5,
    });
  }, [isPendingVnPayCheckout, pendingOrderCode]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const response = await shippingAddressApi.getMyAddresses();
        const addresses = response?.data || response || [];
        const list = Array.isArray(addresses) ? addresses : [];
        setSavedAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find(a => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
          setAddressMode('existing');
        } else {
          setAddressMode('new');
        }
      } catch (error) {
        console.error('Lỗi khi tải địa chỉ:', error);
        setAddressMode('new');
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Bạn chưa chọn sản phẩm nào để thanh toán</h1>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
        >
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phone') {
      setPhoneTouched(true);
      setFormData({
        ...formData,
        phone: value.replace(/\D/g, '').slice(0, 11),
      });
      return;
    }
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleDeleteAddress = (addr) => {
    Modal.confirm({
      title: 'Xóa địa chỉ',
      content: `Bạn có chắc muốn xóa địa chỉ của ${addr.receiverName}?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await shippingAddressApi.remove(addr.id);
          if (res?.statusCode !== 200 && res?.code !== 'SUCCESS') {
            throw new Error(res?.message || 'Không thể xóa địa chỉ');
          }
          const newList = savedAddresses.filter((a) => a.id !== addr.id);
          setSavedAddresses(newList);
          if (selectedAddressId === addr.id) {
            const next = newList.find((a) => a.isDefault) || newList[0];
            setSelectedAddressId(next?.id || null);
            if (newList.length === 0) setAddressMode('new');
          }
          notification.success({
            message: 'Đã xóa địa chỉ',
            placement: 'topRight',
          });
        } catch (error) {
          notification.error({
            message: 'Không thể xóa địa chỉ',
            description: error?.response?.data?.message || error?.message || 'Vui lòng thử lại.',
            placement: 'topRight',
          });
        }
      },
    });
  };

  const redirectToVnPay = (paymentUrl, orderId, orderCode) => {
    const returnTo = location.state?.returnTo
      || resolveMainflow2ChatPath({ items: cartItems });
    saveVnPayCheckoutPending({
      cartItems,
      orderId,
      orderCode,
      paymentMethod: 'VNPAY',
      paymentPhase,
      returnTo,
      savedAt: Date.now(),
    });
    console.info('[Payment] Chuyển cổng thanh toán: VNPAY', paymentUrl);
    window.location.href = paymentUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isPendingVnPayCheckout && pendingOrderId) {
        const retryPhase = pendingVnPaySession?.paymentPhase || paymentPhase;
        const txRes = await performTransactionApi({
          orderId: pendingOrderId,
          paymentMethod: formData.paymentMethod,
          paymentPhase: retryPhase,
        });
        const tx = txRes?.data || txRes;
        const paymentUrl = tx?.paymentLink || tx?.checkoutUrl || tx?.paymentUrl;

        if (formData.paymentMethod === 'VNPAY' && paymentUrl) {
          redirectToVnPay(paymentUrl, pendingOrderId, pendingOrderCode);
          return;
        }

        clearVnPayCheckoutPending();
        try { clearCart(); } catch { /* ignore */ }
        notification.success({
          message: 'Đặt hàng thành công',
          description: pendingOrderCode ? `Mã đơn: ${pendingOrderCode}` : undefined,
          placement: 'topRight',
          duration: 2,
        });
        navigate('/order-confirmation', { state: { orderId: pendingOrderId, orderCode: pendingOrderCode } });
        return;
      }

      let shippingAddressId;
      if (addressMode === 'existing' && selectedAddressId) {
        shippingAddressId = toGuidString(selectedAddressId, 'Địa chỉ giao hàng');
      } else {
        if (!newAddressGhnReady) {
          throw new Error('Vui lòng chọn đủ Tỉnh → Quận → Phường theo danh mục GHN.');
        }
        if (!phoneValid) {
          setPhoneTouched(true);
          throw new Error(VIETNAMESE_PHONE_ERROR);
        }
        const payload = {
          receiverName: formData.receiverName.trim(),
          phone: normalizeVietnamesePhone(formData.phone),
          addressLine: formData.addressLine,
          ward: ghnLocation.wardName,
          district: ghnLocation.districtName,
          city: ghnLocation.provinceName,
          province: formData.province,
          isDefault: formData.isDefault,
          ghnDistrictId: ghnLocation.districtId,
          ghnWardCode: ghnLocation.wardCode,
        };
        const res = await shippingAddressApi.add(payload);
        const rawAddrId =
          res?.data?.id ||
          res?.data?.Id ||
          (typeof res?.data === 'string' ? res.data : null) ||
          res?.id ||
          res?.Id;
        if (!rawAddrId || typeof rawAddrId === 'object') {
          throw new Error('Không lấy được ID địa chỉ mới');
        }
        shippingAddressId = toGuidString(rawAddrId, 'Địa chỉ giao hàng');
      }

      const orderPayload = {
        shippingAddressId,
        shippingFee: effectiveShippingFee,
        shippingCarrier: shippingCarrier || 'MANUAL',
        note: formData.note || '',
        items: cartItems.map((it) => {
          const base = { sourceType: it.sourceType || 'IN_STOCK', quantity: Number(it.quantity) || 1 };
          if (it.variantId) base.designVariantId = toGuidString(it.variantId, 'Sản phẩm');
          if (it.designWorkId) base.designWorkId = toGuidString(it.designWorkId, 'Thiết kế');
          if (!base.designVariantId && !base.designWorkId) {
            throw new Error('Thiếu ID sản phẩm. Vui lòng chọn lại từ Cửa hàng.');
          }
          return base;
        }),
      };

      const orderRes = await checkoutOrderApi(orderPayload);
      const orderData = orderRes?.data || orderRes;
      const rawOrderId = orderData?.orderId || orderData?.OrderId || orderData?.id || orderData?.Id;
      const orderId = toGuidString(rawOrderId, 'Đơn hàng');
      const orderCode = orderData?.code;
      if (!orderId || typeof orderId === 'object') {
        throw new Error('Không lấy được ID đơn hàng');
      }

      let txRes;
      try {
        txRes = await performTransactionApi({
          orderId,
          paymentMethod: formData.paymentMethod,
          paymentPhase,
        });
      } catch (txError) {
        console.error('Payment step failed:', txError);
        const payMsg =
          txError?.response?.data?.message
          || txError?.response?.data?.data
          || txError?.message
          || 'Không tạo được link thanh toán.';
        notification.warning({
          message: 'Đơn đã tạo nhưng thanh toán chưa hoàn tất',
          description: `${orderCode ? `Mã đơn: ${orderCode}. ` : ''}${payMsg} Bạn có thể thanh toán lại trong "Đơn của tôi" hoặc chọn COD.`,
          placement: 'topRight',
          duration: 6,
        });
        navigate('/my-orders');
        return;
      }

      const tx = txRes?.data || txRes;
      const paymentUrl = tx?.paymentLink || tx?.checkoutUrl || tx?.paymentUrl;

      const returnTo = location.state?.returnTo;
      if (formData.paymentMethod === 'VNPAY' && paymentUrl) {
        redirectToVnPay(paymentUrl, orderId, orderCode);
        return;
      }

      clearVnPayCheckoutPending();
      try { clearCart(); } catch { /* ignore */ }

      notification.success({
        message: 'Đặt hàng thành công',
        description: orderCode ? `Mã đơn: ${orderCode}` : undefined,
        placement: 'topRight',
        duration: 2,
      });

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/order-confirmation', { state: { orderId, orderCode } });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      notification.error({
        message: 'Đặt hàng thất bại',
        description:
          error?.response?.data?.detail
          || error?.response?.data?.message
          || error?.response?.data?.Message
          || error.message
          || 'Có lỗi xảy ra.',
        placement: 'topRight',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
        <p className="text-gray-500 mt-1">Hoàn tất thông tin để đặt hàng</p>
        {isPendingVnPayCheckout && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold m-0">Đơn hàng đã tạo — chờ thanh toán VNPay</p>
            <p className="mt-1 mb-0 text-amber-800">
              {pendingOrderCode ? `Mã đơn: ${pendingOrderCode}. ` : ''}
              Bạn đã quay lại từ cổng thanh toán. Chọn VNPay và bấm nút bên dưới để thanh toán tiếp, hoặc{' '}
              <button
                type="button"
                onClick={() => navigate(`/orders/${pendingOrderId}`)}
                className="font-semibold text-indigo-700 hover:underline cursor-pointer"
              >
                xem chi tiết đơn
              </button>
              .
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-900">Địa chỉ giao hàng</h2>
            </div>
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAddressMode('existing')}
                disabled={savedAddresses.length === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  addressMode === 'existing'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : savedAddresses.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <LocationIcon />
                Chọn địa chỉ có sẵn {savedAddresses.length > 0 && `(${savedAddresses.length})`}
              </button>
              <button
                type="button"
                onClick={() => setAddressMode('new')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  addressMode === 'new'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PlusIcon />
                Tạo địa chỉ mới
              </button>
            </div>

            {addressMode === 'existing' && (
              <div className="space-y-3">
                {loadingAddresses ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Đang tải danh sách địa chỉ...</div>
                ) : savedAddresses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p>Bạn chưa có địa chỉ nào được lưu.</p>
                    <button type="button" onClick={() => setAddressMode('new')} className="mt-2 text-indigo-600 font-medium hover:underline cursor-pointer">
                      Tạo địa chỉ mới
                    </button>
                  </div>
                ) : (
                  savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-150 ${
                        selectedAddressId === addr.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <label className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="radio"
                          name="selectedAddress"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="w-4 h-4 mt-1 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">{addr.receiverName}</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-sm text-gray-600">{addr.phone}</span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {[addr.addressLine, addr.ward, addr.district, addr.city, addr.province].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <span className="text-indigo-600 flex-shrink-0">
                            <CheckCircleIcon />
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr)}
                        className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Xóa địa chỉ"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {addressMode === 'new' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Họ và tên người nhận *</label>
                  <input name="receiverName" type="text" value={formData.receiverName} onChange={handleChange} required={addressMode === 'new'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Số điện thoại *</label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => setPhoneTouched(true)}
                    required={addressMode === 'new'}
                    pattern="0[0-9]{9,10}"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                      phoneError ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="0901234567"
                  />
                  {phoneError && (
                    <p className="mt-1 text-xs text-red-600 m-0">{phoneError}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Địa chỉ (Số nhà, Tên đường) *</label>
                  <input name="addressLine" type="text" value={formData.addressLine} onChange={handleChange} required={addressMode === 'new'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="88 Phước Thiện" />
                </div>
                <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                    Khu vực giao hàng (GHN) — bắt buộc để tính phí ship
                  </p>
                  <GhnLocationPicker value={ghnLocation} onChange={setGhnLocation} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Quốc gia</label>
                  <input name="province" type="text" value={formData.province} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-900">Phương thức thanh toán</h2>
            </div>
            <div className="space-y-3">
              {availablePaymentMethods.map((method) => (
                <label key={method.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer ${
                  formData.paymentMethod === method.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="paymentMethod" value={method.value} checked={formData.paymentMethod === method.value} onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {collectOnDelivery && (
              <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                COD: bạn thanh toán tiền hàng + phí ship khi nhận — không cần thanh toán online trước.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-900">Vận chuyển</h2>
            </div>
            {shippingGhnReady ? (
              <ShippingCarrierSelect
                shippingAddressId={addressMode === 'existing' ? quoteAddressId : undefined}
                ghnToDistrictId={addressMode === 'new' ? ghnLocation.districtId : undefined}
                ghnToWardCode={addressMode === 'new' ? ghnLocation.wardCode : undefined}
                orderValue={subtotal}
                weightGrams={500}
                collectOnDelivery={collectOnDelivery}
                selectedCarrier={shippingCarrier}
                selectedFee={shippingFee}
                onChange={handleShippingChange}
              />
            ) : (
              <p className="text-sm text-gray-500">
                {addressMode === 'new'
                  ? 'Chọn đủ Tỉnh → Quận → Phường GHN ở trên để xem phí vận chuyển trước khi đặt hàng.'
                  : 'Chọn địa chỉ có sẵn để xem phí vận chuyển (hệ thống tự map mã GHN từ Phường/Quận/Tỉnh).'}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-900">Ghi chú</h2>
            </div>
            <textarea name="note" value={formData.note} onChange={handleChange} rows={3}
              placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none" />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Đơn hàng của bạn</h2>
            {hasPreOrderItems && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                <p className="font-semibold m-0">Lưu ý: Một phần sản phẩm cần in thêm</p>
                <ul className="mt-1.5 mb-0 pl-4 space-y-1 list-disc">
                  {preOrderLines.map((it, idx) => {
                    const name = it.designTemplateName ? `${it.designTemplateName} — ${it.name}` : it.name;
                    const extra = getPreOrderQuantity(it.quantity, it.stock);
                    const fromStock = Math.max(0, (Number(it.stock) || 0));
                    return (
                      <li key={idx}>
                        {fromStock > 0
                          ? `${name}: ${fromStock} lấy từ kho, ${extra} sản phẩm sẽ in thêm.`
                          : `${name}: ${extra} sản phẩm sẽ in thêm.`}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 mb-0 text-amber-800">
                  Đơn hàng sẽ vào hàng đợi sản xuất — thời gian nhận hàng có thể lâu hơn bình thường.
                </p>
              </div>
            )}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              {cartItems.map((it, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
                    {it.modelSrc ? (
                      <model-viewer src={it.modelSrc} camera-controls={false} auto-rotate interaction-prompt="none"
                        style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><PackageIcon /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {it.designTemplateName ? `${it.designTemplateName} — ${it.name}` : it.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {it.material} · x{it.quantity}
                      {needsAdditionalPrinting(it.quantity, it.stock, it.isAllowPreOrder) && (
                        <span className="text-amber-600"> · cần in thêm {getPreOrderQuantity(it.quantity, it.stock)}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                    {formatPrice((it.price || 0) * (it.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Phí vận chuyển{shippingCarrier ? ` (${shippingCarrier})` : ''}
                </span>
                <span className="font-medium text-gray-900">{formatPrice(effectiveShippingFee)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-indigo-600 text-lg">{formatPrice(total)}</span>
              </div>
              {isCustomDepositCheckout && (
                <>
                  {designFeeAmount > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Tiền thiết kế</span>
                      <span>{formatPrice(designFeeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    <span>Cọc {CUSTOM_DEPOSIT_PERCENT}% tiền thiết kế</span>
                    <span className="font-semibold">{formatPrice(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Còn lại sau khi có bảng thiết kế</span>
                    <span>{formatPrice(balanceAfterDeposit)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting
                || (!isPendingVnPayCheckout && (
                  (addressMode === 'existing' && !selectedAddressId)
                  || (addressMode === 'new' && !newAddressFormReady)
                  || (addressMode === 'existing' && (!shippingGhnReady || !shippingQuoteReady))
                ))
              }
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer flex items-center justify-center ${
                isSubmitting || (!isPendingVnPayCheckout && addressMode === 'existing' && !selectedAddressId)
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {isSubmitting ? <><SpinnerIcon />Đang xử lý...</> : isPendingVnPayCheckout ? 'Thanh toán lại' : isCustomDepositCheckout ? `Đặt cọc ${formatPrice(depositAmount)}` : 'Đặt hàng ngay'}
            </button>
            {isCustomDepositCheckout && (
              <p className="text-xs text-center text-amber-700">
                Cọc {CUSTOM_DEPOSIT_PERCENT}% trên tiền thiết kế qua VNPay. Sau khi NV gửi bảng thiết kế, hoàn tất phần còn lại của tổng đơn.
              </p>
            )}
            <p className="text-xs text-center text-gray-400">
              Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của chúng tôi.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
