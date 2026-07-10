import { resolvePublicMediaUrl } from './mediaUrl';

import glbBeeCute from '../components/imgs/glb/BeeCute.glb';
import glbBirdCute from '../components/imgs/glb/BirdCute.glb';
import glbBumbleCute from '../components/imgs/glb/BumbleCute.glb';
import glbChickCute from '../components/imgs/glb/ChickCute.glb';
import glbEggCute from '../components/imgs/glb/EggCute.glb';
import glbModel1 from '../components/imgs/glb/model1.glb';
import glbModel2 from '../components/imgs/glb/model2.glb';
import glbModel3 from '../components/imgs/glb/model3.glb';
import glbModel4 from '../components/imgs/glb/model4.glb';
import glbModel5 from '../components/imgs/glb/model5.glb';
import glbModel6 from '../components/imgs/glb/model6.glb';

export const FALLBACK_GLBS = [
  glbBeeCute,
  glbBirdCute,
  glbBumbleCute,
  glbChickCute,
  glbEggCute,
  glbModel1,
  glbModel2,
  glbModel3,
  glbModel4,
  glbModel5,
  glbModel6,
];

export const formatPrice = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const LOW_STOCK_THRESHOLD = 5;

export const formatStockLabel = (stock) => {
  const qty = Number(stock) || 0;
  if (qty <= LOW_STOCK_THRESHOLD) {
    return `Chỉ còn sẵn ${qty} sản phẩm`;
  }
  return `Còn sẵn ${qty} sản phẩm`;
};

/** Số lượng vượt tồn kho cần in thêm (0 nếu đủ kho). */
export const getPreOrderQuantity = (quantity, stock) => {
  const qty = Number(quantity) || 0;
  const available = Math.max(0, Number(stock) || 0);
  return Math.max(0, qty - available);
};

export const needsAdditionalPrinting = (quantity, stock, isAllowPreOrder) =>
  Boolean(isAllowPreOrder) && getPreOrderQuantity(quantity, stock) > 0;

/** Loại hàng trên giỏ: pre_order khi số lượng mua > tồn kho. */
export const resolveCartItemSourceType = (item) => {
  const staticType = item?.product?.sourceType;
  if (staticType === 'custom') return 'custom';

  const stock = item?.product?.stock;
  if (stock == null) {
    return staticType === 'pre_order' ? 'pre_order' : 'in_stock';
  }

  const quantity = Number(item?.quantity) || 0;
  const available = Math.max(0, Number(stock) || 0);
  return quantity > available ? 'pre_order' : 'in_stock';
};

export const pickFallbackGlb = (id) => {
  if (!id) return FALLBACK_GLBS[0];
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_GLBS[Math.abs(hash) % FALLBACK_GLBS.length];
};

const readField = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return null;
};

export const normalizeVariant = (v) => {
  const id = v?.id != null ? String(v.id) : v?.Id != null ? String(v.Id) : undefined;
  const effectiveModel = readField(
    v,
    'effectivePreviewModelUrl',
    'EffectivePreviewModelUrl',
    'previewModelUrl',
    'PreviewModelUrl',
    'designTemplateFileUrl',
    'DesignTemplateFileUrl',
  );
  const effectiveThumb = readField(
    v,
    'effectiveThumbnailUrl',
    'EffectiveThumbnailUrl',
    'previewImageUrl',
    'PreviewImageUrl',
    'designTemplateThumbnailUrl',
    'DesignTemplateThumbnailUrl',
    'thumbnailUrl',
    'ThumbnailUrl',
  );
  const previewModelUrl = effectiveModel ? resolvePublicMediaUrl(effectiveModel) : null;
  const hasOwnPreview = Boolean(readField(v, 'previewModelUrl', 'PreviewModelUrl'));
  const hasOwnImage = Boolean(readField(v, 'previewImageUrl', 'PreviewImageUrl'));

  return {
    id,
    code: v?.code ?? v?.Code,
    name: v?.name || v?.Name || v?.designTemplateName || v?.DesignTemplateName || 'Sản phẩm',
    description: v?.description ?? v?.Description,
    price: Number(v?.price ?? v?.Price ?? 0),
    stock: Number(v?.stockQuantity ?? v?.StockQuantity ?? 0),
    material: v?.materialName || v?.MaterialName || 'PLA',
    materialId: v?.materialId != null ? String(v.materialId) : v?.MaterialId != null ? String(v.MaterialId) : v?.materialId,
    designTemplateId: v?.designTemplateId ?? v?.DesignTemplateId,
    designTemplateName: v?.designTemplateName ?? v?.DesignTemplateName,
    thumbnailUrl: effectiveThumb ? resolvePublicMediaUrl(effectiveThumb) : null,
    modelSrc: previewModelUrl || pickFallbackGlb(id),
    isAllowPreOrder: !!(v?.isAllowPreOrder ?? v?.IsAllowPreOrder),
    usesTemplateMedia: (v?.usesTemplateMedia ?? v?.UsesTemplateMedia) !== false && !hasOwnPreview && !hasOwnImage,
  };
};

export const sortFeaturedVariants = (products) =>
  [...products].sort((a, b) => {
    const aInStock = a.stock > 0 ? 1 : 0;
    const bInStock = b.stock > 0 ? 1 : 0;
    if (bInStock !== aInStock) return bInStock - aInStock;
    return b.price - a.price;
  });
