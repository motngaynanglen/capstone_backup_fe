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

export const pickFallbackGlb = (id) => {
  if (!id) return FALLBACK_GLBS[0];
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_GLBS[Math.abs(hash) % FALLBACK_GLBS.length];
};

export const normalizeVariant = (v) => {
  const rawPreview =
    v?.previewModelUrl || v?.designTemplateThumbnailUrl || v?.thumbnailUrl || null;
  const previewModelUrl = rawPreview ? resolvePublicMediaUrl(rawPreview) : null;

  return {
    id: v?.id != null ? String(v.id) : v?.id,
    code: v?.code,
    name: v?.name || v?.designTemplateName || 'Sản phẩm',
    description: v?.description,
    price: Number(v?.price ?? 0),
    stock: Number(v?.stockQuantity ?? 0),
    material: v?.materialName || 'PLA',
    materialId: v?.materialId,
    designTemplateId: v?.designTemplateId,
    designTemplateName: v?.designTemplateName,
    thumbnailUrl: v?.designTemplateThumbnailUrl
      ? resolvePublicMediaUrl(v.designTemplateThumbnailUrl)
      : null,
    modelSrc: previewModelUrl || pickFallbackGlb(v?.id),
    isAllowPreOrder: !!v?.isAllowPreOrder,
  };
};

export const sortFeaturedVariants = (products) =>
  [...products].sort((a, b) => {
    const aInStock = a.stock > 0 ? 1 : 0;
    const bInStock = b.stock > 0 ? 1 : 0;
    if (bInStock !== aInStock) return bInStock - aInStock;
    return b.price - a.price;
  });
