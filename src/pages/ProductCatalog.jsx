import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

import materialApi from '../api/materialApi';
import designVariantApi from '../api/designVariantApi';
import conceptTagApi from '../api/conceptTagApi';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/catalog/ProductCard';
import { normalizeVariant } from '../utils/catalogProduct';

const sameId = (a, b) => String(a ?? '') === String(b ?? '');

const buildVariantQuery = ({ materialId, conceptTagId, designTemplateId }) => {
  const params = { isActive: true };
  if (materialId) params.materialId = String(materialId);
  if (designTemplateId) params.designTemplateId = String(designTemplateId);
  if (conceptTagId) params.conceptTagId = String(conceptTagId);
  return params;
};

const ProductCatalog = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [conceptTags, setConceptTags] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const conceptTagId = searchParams.get('conceptTag') || '';
  const designTemplateId =
    searchParams.get('template') || searchParams.get('designTemplate') || '';
  const urlQuery = searchParams.get('q') || '';
  const [searchKeyword, setSearchKeyword] = useState(urlQuery);

  const activeConceptTag = useMemo(
    () => conceptTags.find((t) => sameId(t.id, conceptTagId)),
    [conceptTags, conceptTagId]
  );

  const fetchVariants = useCallback(async (materialId, templateId, tagId) => {
    setLoading(true);
    try {
      const response = await designVariantApi.getAll(
        buildVariantQuery({
          materialId: materialId || null,
          designTemplateId: templateId || null,
          conceptTagId: tagId || null,
        })
      );
      const list = Array.isArray(response?.data) ? response.data : [];
      setVariants(list.map(normalizeVariant));
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchKeyword(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [matRes, tagRes] = await Promise.all([
          materialApi.getAll(),
          conceptTagApi.getAll(),
        ]);
        if (cancelled) return;

        const matList = (matRes?.data || []).filter((m) => m.isActive !== false);
        const tagList = (tagRes?.data || [])
          .filter((t) => t.isActive !== false)
          .sort((a, b) => {
            if (a.isMainTag !== b.isMainTag) return (b.isMainTag ? 1 : 0) - (a.isMainTag ? 1 : 0);
            return (a.name || '').localeCompare(b.name || '', 'vi');
          });

        setMaterials(matList);
        setConceptTags(tagList);
      } catch (e) {
        console.error('Lỗi tải bộ lọc:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedMaterialId('');
    fetchVariants(null, designTemplateId || null, conceptTagId || null);
  }, [conceptTagId, designTemplateId, fetchVariants]);

  const handleMaterialChange = (materialId) => {
    const next = materialId ? String(materialId) : '';
    setSelectedMaterialId(next);
    fetchVariants(next || null, designTemplateId || null, conceptTagId || null);
  };

  const handleConceptTagChange = (tagId) => {
    const next = new URLSearchParams(searchParams);
    if (tagId) next.set('conceptTag', String(tagId));
    else next.delete('conceptTag');
    setSearchParams(next);
  };

  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    const next = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    setSelectedMaterialId('');
    setSearchKeyword('');
    navigate('/products');
  };

  const filtered = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) =>
      [v.name, v.designTemplateName, v.code, v.material, v.description].some((s) =>
        (s || '').toLowerCase().includes(q)
      )
    );
  }, [variants, searchKeyword]);

  const hasActiveFilters = Boolean(
    conceptTagId || designTemplateId || selectedMaterialId || searchKeyword.trim()
  );

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
      1
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 m-0">
            Danh sách sản phẩm in 3D
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {activeConceptTag?.name
              ? `Danh mục: ${activeConceptTag.name}`
              : 'Di chuột vào sản phẩm để xem mô hình 3D trực tiếp. Chọn nhanh mẫu in sẵn hoặc đặt in theo yêu cầu.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <input
            type="search"
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400 w-48"
          />
          {[
            { mode: 'grid', label: 'Grid' },
            { mode: 'list', label: 'List' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${viewMode === mode ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {conceptTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 mr-1">Danh mục:</span>
          <button
            type="button"
            onClick={() => handleConceptTagChange('')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${!conceptTagId ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
          >
            Tất cả
          </button>
          {conceptTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleConceptTagChange(tag.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${sameId(conceptTagId, tag.id) ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 mr-1">Chất liệu:</span>
        <button
          type="button"
          onClick={() => handleMaterialChange('')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${!selectedMaterialId ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
        >
          Tất cả
        </button>
        {materials.map((material) => (
          <button
            key={material.id}
            type="button"
            onClick={() => handleMaterialChange(material.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${sameId(selectedMaterialId, material.id) ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
          >
            {material.name}
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Đang lọc:</span>
          {activeConceptTag && (
            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 font-medium">
              {activeConceptTag.name}
            </span>
          )}
          {selectedMaterialId && (
            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 font-medium">
              {materials.find((m) => sameId(m.id, selectedMaterialId))?.name || 'Chất liệu'}
            </span>
          )}
          {searchKeyword.trim() && (
            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 font-medium">
              &quot;{searchKeyword.trim()}&quot;
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-indigo-600 hover:underline cursor-pointer font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Tìm thấy <b>{filtered.length}</b> sản phẩm
            {variants.length !== filtered.length && (
              <span className="text-slate-400"> (trong {variants.length} kết quả lọc)</span>
            )}
          </span>
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
              onClick={clearAllFilters}
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
