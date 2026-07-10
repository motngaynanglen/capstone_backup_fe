import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

import materialApi from '../api/materialApi';
import designVariantApi from '../api/designVariantApi';
import conceptTagApi from '../api/conceptTagApi';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/catalog/ProductCard';
import { normalizeVariant } from '../utils/catalogProduct';

const ProductCatalog = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const conceptTagId = searchParams.get('conceptTag') || null;
  const designTemplateId =
    searchParams.get('template') || searchParams.get('designTemplate') || null;

  const fetchVariants = async (materialId, templateId, tagId) => {
    setLoading(true);
    try {
      const params = { isActive: true };
      if (materialId) params.materialId = materialId;
      if (templateId) params.designTemplateId = templateId;
      if (tagId) params.conceptTagId = tagId;
      const response = await designVariantApi.getAll(params);
      const list = Array.isArray(response?.data) ? response.data : [];
      setVariants(list.map(normalizeVariant));
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const matRes = await materialApi.getAll();
        setMaterials(matRes?.data || []);
      } catch (e) {
        console.error('Lỗi materials:', e);
      }

      if (conceptTagId) {
        try {
          const tagRes = await conceptTagApi.getAll();
          const tag = (tagRes?.data || []).find((t) => String(t.id) === conceptTagId);
          setFilterLabel(tag?.name ? `Danh mục: ${tag.name}` : '');
        } catch {
          setFilterLabel('');
        }
      } else {
        setFilterLabel('');
      }

      await fetchVariants(null, designTemplateId, conceptTagId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptTagId, designTemplateId]);

  const handleMaterialChange = (materialId) => {
    setSelectedMaterialId(materialId || '');
    fetchVariants(materialId || null, designTemplateId, conceptTagId);
  };

  const filtered = useMemo(() => {
    if (!searchKeyword.trim()) return variants;
    const q = searchKeyword.trim().toLowerCase();
    return variants.filter(v =>
      [v.name, v.designTemplateName, v.code, v.material].some(s => (s || '').toLowerCase().includes(q))
    );
  }, [variants, searchKeyword]);

  const quickBuy = (product) => {
    navigate('/checkout', {
      state: {
        cartItems: [{
          variantId: product.id != null ? String(product.id) : undefined,
          name: product.name,
          designTemplateName: product.designTemplateName,
          price: product.price,
          quantity: 1,
          material: product.material,
          modelSrc: product.modelSrc,
          sourceType: product.stock > 0 ? 'IN_STOCK' : 'PRE_ORDER',
        }],
      },
    });
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      designTemplateName: product.designTemplateName,
      price: product.price,
      modelSrc: product.modelSrc,
      sourceType: product.stock > 0 ? 'in_stock' : 'pre_order',
      stock: product.stock,
      materials: [product.material],
    }, 1, product.material);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 m-0">
            Danh sách sản phẩm in 3D
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {filterLabel || 'Di chuột vào sản phẩm để xem mô hình 3D trực tiếp. Chọn nhanh mẫu in sẵn hoặc đặt in theo yêu cầu.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <input
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400 w-48"
          />
          {[
            { mode: 'grid', label: 'Grid' },
            { mode: 'list', label: 'List' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${viewMode === mode ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 mr-1">Chất liệu:</span>
        <button
          type="button"
          onClick={() => handleMaterialChange('')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${selectedMaterialId === '' ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
        >
          Tất cả
        </button>
        {materials.map((material) => (
          <button
            key={material.id}
            type="button"
            onClick={() => handleMaterialChange(material.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${selectedMaterialId === material.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
          >
            {material.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Tìm thấy <b>{filtered.length}</b> sản phẩm</span>
          <span>Giá đã bao gồm chi phí vật liệu in cơ bản</span>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Spin tip="Đang tải sản phẩm..." />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-3'}>
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onQuickBuy={quickBuy}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <p className="font-medium">Không tìm thấy sản phẩm nào</p>
            <button
              type="button"
              className="mt-3 text-sm text-indigo-600 hover:underline cursor-pointer"
              onClick={() => {
                setSelectedMaterialId('');
                setSearchKeyword('');
                if (conceptTagId || designTemplateId) {
                  navigate('/products');
                } else {
                  fetchVariants(null, null, null);
                }
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;
