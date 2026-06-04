export function getModel3dKind(fileUrl) {
  if (!fileUrl) return 'unknown';
  const lower = fileUrl.split('?')[0].toLowerCase();
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'gltf';
  if (lower.endsWith('.stl')) return 'stl';
  if (lower.endsWith('.obj')) return 'obj';
  return 'unknown';
}

export function isImageUrl(url) {
  if (!url) return false;
  const lower = url.split('?')[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower);
}
