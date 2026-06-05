import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import designVariantApi from '../api/designVariantApi';
import { normalizeVariant, formatPrice } from '../utils/catalogProduct';
import {
  Button,
  InputNumber,
  Breadcrumb,
  Divider,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Spin,
  Result,
  notification,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import '@google/model-viewer';
import FeedbackCommentsList from '../components/Feedback/FeedbackCommentsList';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await designVariantApi.getDetail(id);
        const raw = res?.data;
        if (!raw) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!cancelled) {
          setProduct(normalizeVariant(raw));
          setQuantity(1);
        }
      } catch (err) {
        console.error('Product detail load error:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const buildCartItem = () => ({
    variantId: product.id != null ? String(product.id) : undefined,
    name: product.name,
    designTemplateName: product.designTemplateName,
    price: product.price,
    quantity,
    material: product.material,
    modelSrc: product.modelSrc,
    sourceType: 'IN_STOCK',
  });

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      notification.info({ message: 'Vui lòng đăng nhập để mua hàng' });
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { cartItems: [buildCartItem()] } });
  };

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        designTemplateName: product.designTemplateName,
        price: product.price,
        modelSrc: product.modelSrc,
        sourceType: 'IN_STOCK',
        stock: product.stock,
        materials: [product.material],
      },
      product.material,
      quantity
    );
    notification.success({ message: 'Đã thêm vào giỏ hàng' });
  };

  const handlePreOrder = () => {
    if (!isAuthenticated) {
      notification.info({ message: 'Vui lòng đăng nhập để đặt trước' });
      navigate('/login');
      return;
    }
    const preOrderItem = {
      variantId: product.id != null ? String(product.id) : undefined,
      name: product.name,
      designTemplateName: product.designTemplateName,
      price: product.price,
      quantity,
      material: product.material,
      modelSrc: product.modelSrc,
      sourceType: 'PRE_ORDER',
    };
    navigate('/checkout', { state: { cartItems: [preOrderItem] } });
  };

  const outOfStock = product && product.stock <= 0;
  const canOrder = product && (product.stock > 0 || product.isAllowPreOrder);
  const showBuyNow = isCustomer;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Result
          status="404"
          title="Không tìm thấy sản phẩm"
          subTitle="Sản phẩm có thể đã ngừng bán hoặc liên kết không hợp lệ."
          extra={
            <Button type="primary" onClick={() => navigate('/products')}>
              Về danh sách sản phẩm
            </Button>
          }
        />
      </div>
    );
  }

  const displayName = product.designTemplateName
    ? `${product.designTemplateName} — ${product.name}`
    : product.name;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            Quay lại
          </Button>
          <Breadcrumb
            items={[
              { title: <Link to="/">Trang chủ</Link> },
              { title: <Link to="/products">Sản phẩm</Link> },
              { title: displayName },
            ]}
          />
        </div>

        <Card className="mb-6">
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <div className="sticky top-24">
                <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-slate-50 relative aspect-square w-full">
                  <model-viewer
                    src={product.modelSrc}
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    environment-image="neutral"
                    exposure="1.2"
                    style={{ width: '100%', height: '100%', backgroundColor: '#f8fafc' }}
                  />
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm">
                    3D Interactive
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3 m-0">{displayName}</h1>
                {product.code && (
                  <p className="text-sm text-slate-500 mb-3 m-0">Mã: {product.code}</p>
                )}

                <div className="mb-6">
                  <span className="text-4xl font-bold text-indigo-600">{formatPrice(product.price)}</span>
                </div>

                {product.description && (
                  <div className="mb-6">
                    <p className="text-gray-700 leading-relaxed m-0">{product.description}</p>
                  </div>
                )}

                <Divider />

                {/* Thông số sản phẩm */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <label className="block mb-3 font-semibold text-gray-800">Thông số sản phẩm</label>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Chất liệu:</span>
                      <div><Tag color="blue">{product.material}</Tag></div>
                    </div>
                    <div>
                      <span className="text-gray-500">Tồn kho:</span>
                      <div>
                        <Tag color={product.stock > 5 ? 'success' : product.stock > 0 ? 'warning' : 'default'}>
                          {outOfStock ? 'Hết hàng' : `Còn ${product.stock}`}
                        </Tag>
                      </div>
                    </div>
                    {product.estimatedWeightPerUnit > 0 && (
                      <div>
                        <span className="text-gray-500">Trọng lượng:</span>
                        <div className="font-medium">{product.estimatedWeightPerUnit}g</div>
                      </div>
                    )}
                    {product.estimatedPrintTimePerUnit > 0 && (
                      <div>
                        <span className="text-gray-500">Thời gian in:</span>
                        <div className="font-medium">
                          {product.estimatedPrintTimePerUnit >= 60
                            ? `${Math.floor(product.estimatedPrintTimePerUnit / 60)}h ${product.estimatedPrintTimePerUnit % 60}p`
                            : `${product.estimatedPrintTimePerUnit} phút`}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Đặt trước:</span>
                      <div>
                        {product.isAllowPreOrder
                          ? <Tag color="orange">Cho phép Pre-Order</Tag>
                          : <Tag>Không hỗ trợ</Tag>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Khu vực mua hàng */}
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {/* Còn hàng */}
                  {product.stock > 0 && showBuyNow && (
                    <>
                      {product.isAllowPreOrder && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-amber-700 mb-1">
                            <InfoCircleOutlined />
                            <span className="font-semibold text-sm">Hỗ trợ đặt trước (Pre-Order)</span>
                          </div>
                          <p className="text-xs text-amber-600 m-0">
                            Nhập số lượng vượt tồn kho ({product.stock}) để chuyển sang đặt trước.
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        <label className="font-semibold text-gray-800">Số lượng:</label>
                        <InputNumber
                          min={1}
                          max={product.isAllowPreOrder ? 9999 : product.stock}
                          value={quantity}
                          onChange={(v) => setQuantity(v || 1)}
                          size="large"
                          style={{ width: 120 }}
                        />
                        <span className="text-xs text-gray-400">
                          Còn {product.stock} sản phẩm
                          {product.isAllowPreOrder && quantity > product.stock && (
                            <Tag color="orange" className="ml-2">Pre-Order</Tag>
                          )}
                        </span>
                      </div>
                      {product.isAllowPreOrder && quantity > product.stock ? (
                        <Button
                          type="primary"
                          size="large"
                          icon={<ShoppingOutlined />}
                          onClick={handlePreOrder}
                          block
                          style={{ height: 50, backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                        >
                          Đặt trước (Pre-Order)
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="primary"
                            size="large"
                            icon={<ShoppingOutlined />}
                            onClick={handleBuyNow}
                            block
                            style={{ height: 50 }}
                          >
                            Mua ngay
                          </Button>
                          <Button
                            size="large"
                            icon={<ShoppingCartOutlined />}
                            onClick={handleAddToCart}
                            block
                            style={{ height: 50 }}
                          >
                            Thêm vào giỏ
                          </Button>
                        </>
                      )}
                    </>
                  )}

                  {/* Hết hàng + cho Pre-Order → nút riêng */}
                  {outOfStock && product.isAllowPreOrder && showBuyNow && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amber-700 mb-1">
                          <InfoCircleOutlined />
                          <span className="font-semibold text-sm">Sản phẩm hết hàng — Có thể đặt trước</span>
                        </div>
                        <p className="text-xs text-amber-600 m-0">
                          Đơn Pre-Order sẽ được sản xuất và giao khi sẵn sàng.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <label className="font-semibold text-gray-800">Số lượng đặt trước:</label>
                        <InputNumber
                          min={1}
                          max={9999}
                          value={quantity}
                          onChange={(v) => setQuantity(v || 1)}
                          size="large"
                          style={{ width: 120 }}
                        />
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingOutlined />}
                        onClick={handlePreOrder}
                        block
                        style={{ height: 50, backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                      >
                        Đặt trước (Pre-Order)
                      </Button>
                    </>
                  )}

                  {/* Hết hàng + không Pre-Order */}
                  {outOfStock && !product.isAllowPreOrder && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <span className="text-red-600 font-semibold">Sản phẩm hiện đã hết hàng</span>
                    </div>
                  )}

                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/preview/${id}`)}
                    block
                    style={{ height: 50 }}
                  >
                    Xem toàn màn hình 3D
                  </Button>

                  {!showBuyNow && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <InfoCircleOutlined className="text-blue-600 text-xl mt-1" />
                        <div>
                          <div className="font-semibold text-blue-900 mb-1">Tài khoản quản trị</div>
                          <div className="text-sm text-blue-700">
                            Chức năng mua hàng chỉ dành cho khách hàng. Vui lòng đăng nhập tài khoản Customer.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        <FeedbackCommentsList
          variantId={product.id}
          templateId={product.designTemplateId}
          title="Đánh giá & nhận xét"
        />
      </div>
    </div>
  );
};

export default ProductDetail;
