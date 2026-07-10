import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import designVariantApi from '../api/designVariantApi';
import { normalizeVariant, formatPrice, formatStockLabel, getPreOrderQuantity, needsAdditionalPrinting } from '../utils/catalogProduct';
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
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import FeedbackCommentsList from '../components/Feedback/FeedbackCommentsList';
import ProductModelViewer from '../components/catalog/ProductModelViewer';

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
    stock: product.stock,
    isAllowPreOrder: product.isAllowPreOrder,
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
        sourceType: product.stock > 0 ? 'in_stock' : 'pre_order',
        stock: product.stock,
        isAllowPreOrder: product.isAllowPreOrder,
        materials: [product.material],
      },
      product.material,
      quantity
    );
    notification.success({ message: 'Đã thêm vào giỏ hàng' });
  };

  const outOfStock = product && product.stock <= 0;
  const canOrder = product && (product.stock > 0 || product.isAllowPreOrder);
  const preOrderQty = product ? getPreOrderQuantity(quantity, product.stock) : 0;
  const showPreOrderNote = product && needsAdditionalPrinting(quantity, product.stock, product.isAllowPreOrder);
  const maxQuantity = product
    ? (product.isAllowPreOrder ? 99 : Math.max(product.stock, 1))
    : 1;
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
                  <ProductModelViewer
                    className="absolute inset-0"
                    src={product.modelSrc}
                    fallbackId={product.id}
                    poster={product.thumbnailUrl}
                  />
                  <div className="absolute top-3 right-3 z-10 bg-indigo-600 text-white text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm pointer-events-none">
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

                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-gray-800">Chất liệu</label>
                  <Tag color="blue" className="text-sm px-3 py-1">
                    {product.material}
                  </Tag>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-gray-800">Số lượng</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <InputNumber
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={(v) => setQuantity(v || 1)}
                      size="large"
                      style={{ width: 120 }}
                    />
                    <Tag
                      color={product.stock > 5 ? 'success' : product.stock > 0 ? 'warning' : 'default'}
                      icon={<CheckCircleOutlined />}
                    >
                      {outOfStock
                        ? (product.isAllowPreOrder ? 'Hết hàng — đặt trước' : 'Hết hàng')
                        : formatStockLabel(product.stock)}
                    </Tag>
                  </div>
                  {showPreOrderNote && (
                    <Alert
                      type="warning"
                      showIcon
                      className="mt-3"
                      message="Một phần sản phẩm cần in thêm"
                      description={
                        product.stock > 0
                          ? `Kho còn ${product.stock} sản phẩm. ${preOrderQty} sản phẩm sẽ được in thêm sau khi đặt hàng — thời gian nhận hàng có thể lâu hơn bình thường.`
                          : `Toàn bộ ${quantity} sản phẩm sẽ được in thêm sau khi đặt hàng — thời gian nhận hàng có thể lâu hơn bình thường.`
                      }
                    />
                  )}
                </div>

                <Divider />

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {showBuyNow && (
                    <>
                      <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingOutlined />}
                        onClick={handleBuyNow}
                        disabled={!canOrder}
                        block
                        style={{ height: 50 }}
                      >
                        Mua ngay
                      </Button>
                      <Button
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={handleAddToCart}
                        disabled={!canOrder}
                        block
                        style={{ height: 50 }}
                      >
                        Thêm vào giỏ
                      </Button>
                    </>
                  )}

                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={() =>
                      navigate(`/preview/${id}`, {
                        state: {
                          modelSrc: product.modelSrc,
                          productName: displayName,
                          breadcrumb: [
                            { title: 'Trang chủ', path: '/' },
                            { title: 'Sản phẩm', path: '/products' },
                            { title: displayName, path: `/products/${id}` },
                            { title: 'Xem mô hình 3D', path: null },
                          ],
                        },
                      })
                    }
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

        {product.designTemplateId && (
          <FeedbackCommentsList
            templateId={product.designTemplateId}
            title="Đánh giá & nhận xét"
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
