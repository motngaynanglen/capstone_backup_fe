import axiosInstance from './axiosInstance';

/**
 * Upload flow dùng Presigned URL (Backblaze B2):
 *   1. GET /api/app-support/presigned-{image|model}-url?fileName=... → { UploadUrl, FileUrl }
 *   2. PUT file lên UploadUrl (trực tiếp B2 từ browser, không qua BE)
 *   3. Trả về FileUrl (public URL trên B2)
 *
 * QUAN TRỌNG — Content-Type:
 *   BE ký presigned URL với Content-Type cố định theo extension (xem S3StorageService.cs).
 *   FE PHẢI gửi PUT với ĐÚNG Content-Type đó, nếu không B2 trả 403 SignatureDoesNotMatch.
 */

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
const MODEL_EXTENSIONS = ['glb', 'stl', 'obj', 'fbx', '3mf'];

/**
 * Content-Type map — PHẢI KHỚP với BE S3StorageService._allowedExtensions.
 * Nếu BE chưa có extension nào trong này → cần thêm vào BE trước khi FE dùng.
 */
const EXTENSION_CONTENT_TYPE = {
  // Ảnh
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  // Model 3D
  glb: 'model/gltf-binary',
  stl: 'application/vnd.ms-pki.stl',
  obj: 'application/x-tgif',
  fbx: 'application/octet-stream',
  '3mf': 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
};

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
 * Lấy Content-Type khớp chính xác với BE đã ký trong presigned URL.
 */
function getSignedContentType(fileName) {
  const ext = getFileExtension(fileName);
  return EXTENSION_CONTENT_TYPE[ext] || 'application/octet-stream';
}

/**
 * Lấy presigned upload URL từ BE.
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
 * PUT file trực tiếp lên B2 bằng presigned URL.
 * Content-Type PHẢI khớp chính xác với BE đã ký.
 */
async function putFileToB2(uploadUrl, file, signedFileName) {
  const contentType = getSignedContentType(signedFileName);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Upload lên B2 thất bại (${response.status}): ${errText}`);
  }
}

/**
 * Upload file công khai.
 * Flow: getPresignedUrl → PUT trực tiếp lên B2 → trả FileUrl
 */
export async function uploadPublicFile(file) {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueFileName = `${timestamp}_${safeName}`;

  const { uploadUrl, fileUrl } = await getPresignedUrl(uniqueFileName);
  await putFileToB2(uploadUrl, file, uniqueFileName);

  return {
    data: {
      url: fileUrl,
      publicUrl: fileUrl,
      fileName: file.name,
      size: file.size,
    },
  };
}

export async function uploadImageFile(file) {
  if (!isImageFile(file.name)) {
    throw new Error(`File "${file.name}" không phải ảnh hợp lệ. Hỗ trợ: ${IMAGE_EXTENSIONS.join(', ')}`);
  }
  return uploadPublicFile(file);
}

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
