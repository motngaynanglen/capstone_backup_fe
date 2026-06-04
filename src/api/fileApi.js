import axiosInstance from './axiosInstance';

/**
 * Upload flow dùng Presigned URL (Backblaze B2):
 *   1. GET /api/app-support/presigned-image-url?fileName=... → { UploadUrl, FileUrl }
 *   2. PUT file lên UploadUrl (trực tiếp B2, không qua BE)
 *   3. Trả về FileUrl (public URL trên B2)
 *
 * Tương tự cho model (GLB/STL):
 *   GET /api/app-support/presigned-model-url?fileName=...
 */

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
const MODEL_EXTENSIONS = ['glb', 'stl', 'obj', 'fbx', '3mf'];

function getFileExtension(fileName) {
  return (fileName || '').split('.').pop().toLowerCase();
}

function isImageFile(fileName) {
  return IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
}

function isModelFile(fileName) {
  return MODEL_EXTENSIONS.includes(getFileExtension(fileName));
}

/**
 * Lấy presigned upload URL từ BE.
 * @param {string} fileName — tên file kèm đuôi (vd: "avatar.png", "model.glb")
 * @returns {{ uploadUrl: string, fileUrl: string }}
 */
async function getPresignedUrl(fileName) {
  const ext = getFileExtension(fileName);
  const isModel = isModelFile(fileName);
  const endpoint = isModel
    ? '/api/app-support/presigned-model-url'
    : '/api/app-support/presigned-image-url';

  const response = await axiosInstance.get(endpoint, {
    params: { fileName },
  });

  const data = response.data?.data || response.data;
  const uploadUrl = data?.uploadUrl || data?.UploadUrl;
  const fileUrl = data?.fileUrl || data?.FileUrl;

  if (!uploadUrl) {
    throw new Error(`Không lấy được presigned URL cho file "${fileName}" (ext: .${ext})`);
  }

  return { uploadUrl, fileUrl };
}

/**
 * Upload file lên B2 bằng presigned URL (PUT trực tiếp).
 * @param {string} uploadUrl — presigned URL từ BE
 * @param {File} file — File object
 */
async function putFileToB2(uploadUrl, file) {
  // PUT trực tiếp lên B2, KHÔNG qua axiosInstance (không cần Bearer token)
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Upload lên B2 thất bại (${response.status}): ${errText}`);
  }
}

/**
 * Upload file công khai — thay thế POST /api/files/upload cũ.
 *
 * Flow: getPresignedUrl → PUT lên B2 → trả { url, fileUrl, fileName }
 *
 * @param {File} file — File object từ input
 * @returns {{ data: { url: string, publicUrl: string, fileName: string } }}
 */
export async function uploadPublicFile(file) {
  // Tạo tên file unique để tránh trùng
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueFileName = `${timestamp}_${safeName}`;

  const { uploadUrl, fileUrl } = await getPresignedUrl(uniqueFileName);
  await putFileToB2(uploadUrl, file);

  // Trả format tương thích với code cũ
  return {
    data: {
      url: fileUrl,
      publicUrl: fileUrl,
      fileName: file.name,
      size: file.size,
    },
  };
}

/**
 * Upload file ảnh (shortcut, validate extension).
 */
export async function uploadImageFile(file) {
  if (!isImageFile(file.name)) {
    throw new Error(`File "${file.name}" không phải ảnh hợp lệ. Hỗ trợ: ${IMAGE_EXTENSIONS.join(', ')}`);
  }
  return uploadPublicFile(file);
}

/**
 * Upload file 3D model (shortcut, validate extension).
 */
export async function uploadModelFile(file) {
  if (!isModelFile(file.name)) {
    throw new Error(`File "${file.name}" không phải model 3D hợp lệ. Hỗ trợ: ${MODEL_EXTENSIONS.join(', ')}`);
  }
  return uploadPublicFile(file);
}

export function extractUploadUrl(res) {
  const data = res?.data ?? res;
  return data?.url || data?.publicUrl || data?.fileUrl || null;
}

export { getPresignedUrl, isImageFile, isModelFile };
