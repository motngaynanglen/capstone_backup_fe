import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb, Button, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import designVariantApi from '../api/designVariantApi';
import { normalizeVariant } from '../utils/catalogProduct';
import ProductModelViewer from '../components/catalog/ProductModelViewer';

const Preview3D = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const modelSrcFromState = location.state?.modelSrc;

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
        if (!cancelled) setProduct(normalizeVariant(raw));
      } catch (err) {
        console.error('Preview3D load error:', err);
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

  const displayName = product
    ? product.designTemplateName
      ? `${product.designTemplateName} — ${product.name}`
      : product.name
    : location.state?.productName || 'Sản phẩm';

  const modelSrc = product?.modelSrc || modelSrcFromState;

  const rawBreadcrumb = location.state?.breadcrumb || [
    { title: 'Trang chủ', path: '/' },
    { title: 'Sản phẩm', path: '/products' },
    { title: displayName, path: `/products/${id}` },
    { title: 'Xem mô hình 3D', path: null },
  ];

  const breadcrumbItems = rawBreadcrumb.map((item) => ({
    title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title,
  }));

  if (loading && !modelSrcFromState) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spin size="large" tip="Đang tải mô hình 3D..." />
      </div>
    );
  }

  if (notFound && !modelSrcFromState) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Result
          status="404"
          title="Không tìm thấy mô hình 3D"
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/products/${id}`)}
          className="mb-2"
        >
          Quay lại sản phẩm
        </Button>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-gray-800">{displayName}</h1>
      <p className="text-gray-500 mb-6">Xem toàn màn hình · Kéo để xoay · Cuộn để phóng to</p>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="relative w-full" style={{ height: 'min(75vh, 720px)' }}>
          {modelSrc ? (
            <ProductModelViewer
              className="h-full"
              style={{ height: '100%' }}
              src={modelSrc}
              fallbackId={id}
              poster={product?.thumbnailUrl}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" tip="Đang tải mô hình..." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preview3D;
