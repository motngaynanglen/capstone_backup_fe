import axiosInstance from './axiosInstance';

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
export const MODEL_EXTENSIONS = ['glb', 'stl', 'obj', 'fbx', '3mf'];

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

const EXTENSION_CONTENT_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  glb: 'model/gltf-binary',
  stl: 'application/vnd.ms-pki.stl',
  obj: 'application/x-tgif',
  fbx: 'application/octet-stream',
  '3mf': 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
};

function getFileExtension(fileName) {
  return (fileName || '').split('.').pop().toLowerCase();
}

export function isImageFile(fileName) {
  return IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
}

export function isModelFile(fileName) {
  return MODEL_EXTENSIONS.includes(getFileExtension(fileName));
}

export function getSignedContentType(fileName) {
  return EXTENSION_CONTENT_TYPE[getFileExtension(fileName)] || 'application/octet-stream';
}

function buildSafeFileName(fileName) {
  const fallbackName = fileName || 'upload.bin';
  const normalized = fallbackName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'upload.bin';
}

function apiErrorMessage(error, fallback) {
  const body = error?.response?.data;
  const msg = body?.data || body?.message || body?.Message || error?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

function validateUploadFile(file, expectedType = 'any') {
  if (!file) {
    throw new Error('Chua chon file de upload.');
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File "${file.name}" vuot qua gioi han 20MB.`);
  }

  const ext = getFileExtension(file.name);
  const supported = [...IMAGE_EXTENSIONS, ...MODEL_EXTENSIONS];
  if (!supported.includes(ext)) {
    throw new Error(`Dinh dang .${ext || '?'} chua duoc ho tro. Ho tro: ${supported.join(', ')}.`);
  }

  if (expectedType === 'image' && !isImageFile(file.name)) {
    throw new Error(`File "${file.name}" khong phai anh hop le. Ho tro: ${IMAGE_EXTENSIONS.join(', ')}.`);
  }

  if (expectedType === 'model' && !isModelFile(file.name)) {
    throw new Error(`File "${file.name}" khong phai model 3D hop le. Ho tro: ${MODEL_EXTENSIONS.join(', ')}.`);
  }
}

export async function getPresignedUrl(fileName) {
  const endpoint = isModelFile(fileName)
    ? '/api/app-support/presigned-model-url'
    : '/api/app-support/presigned-image-url';

  try {
    const response = await axiosInstance.get(endpoint, { params: { fileName } });
    const data = response.data?.data || response.data;
    const uploadUrl = data?.uploadUrl || data?.UploadUrl;
    const fileUrl = data?.fileUrl || data?.FileUrl;

    if (!uploadUrl || !fileUrl) {
      throw new Error(`Backend khong tra ve UploadUrl/FileUrl cho "${fileName}".`);
    }

    return { uploadUrl, fileUrl };
  } catch (error) {
    throw new Error(apiErrorMessage(error, `Khong lay duoc presigned URL cho "${fileName}".`));
  }
}

async function putFileToB2(uploadUrl, file, signedFileName) {
  const contentType = getSignedContentType(signedFileName);
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const reason = errText ? `: ${errText}` : '';
    throw new Error(`Upload len B2 that bai (${response.status})${reason}`);
  }
}

export async function uploadPublicFile(file) {
  validateUploadFile(file);

  const uniqueFileName = `${Date.now()}_${buildSafeFileName(file.name)}`;
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
  validateUploadFile(file, 'image');
  return uploadPublicFile(file);
}

export async function uploadModelFile(file) {
  validateUploadFile(file, 'model');
  return uploadPublicFile(file);
}

export function extractUploadUrl(res) {
  const data = res?.data ?? res;
  return data?.url || data?.publicUrl || data?.fileUrl || null;
}

export async function uploadFiles(files, { expectedType = 'any' } = {}) {
  const results = [];
  const errors = [];

  for (const file of Array.from(files || [])) {
    try {
      const response = expectedType === 'image'
        ? await uploadImageFile(file)
        : expectedType === 'model'
          ? await uploadModelFile(file)
          : await uploadPublicFile(file);
      const url = extractUploadUrl(response);
      if (!url) throw new Error(`Server khong tra ve URL cho "${file.name}".`);
      results.push({ file, url, response });
    } catch (error) {
      errors.push({ file, error });
    }
  }

  return { results, errors };
}
