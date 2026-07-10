import axiosInstance from './axiosInstance';
import { uploadFile } from './mainflow2Api';
import { resolvePublicMediaUrl } from '../utils/mediaUrl';

const AI_GENERATE_URL =
  import.meta.env.VITE_AI_GENERATE_URL ||
  'https://nestable-lucille-nonruinously.ngrok-free.dev/generate';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.includes(',')) {
        resolve(result.split(',')[1]);
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const stripDataUriPrefix = (base64) => {
  const trimmed = base64.trim();
  if (trimmed.startsWith('data:')) {
    const comma = trimmed.indexOf(',');
    if (comma >= 0) return trimmed.slice(comma + 1).trim();
  }
  return trimmed;
};

const normalizeBase64 = (input) =>
  stripDataUriPrefix(input)
    .replace(/\s/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

const isLikelyBase64 = (str) => /^[A-Za-z0-9+/=]+$/.test(str);

const isGlbBytes = (bytes) =>
  bytes.length >= 4 &&
  bytes[0] === 0x67 &&
  bytes[1] === 0x6c &&
  bytes[2] === 0x54 &&
  bytes[3] === 0x46;

const base64ToBytes = (base64) => {
  const normalized = normalizeBase64(base64);
  if (!normalized || !isLikelyBase64(normalized)) {
    throw new Error('AI trả về dữ liệu không phải base64 GLB hợp lệ');
  }

  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;

  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new Error('Không decode được base64 GLB từ AI');
  }
};

const bytesToGlbFile = (bytes, fileName = 'ai-model.glb') =>
  new File([bytes], fileName, { type: 'model/gltf-binary' });

const extractGlbBase64FromJson = (json) => {
  if (json?.error_code || json?.error) {
    throw new Error(json.text || json.error || json.message || 'AI generate lỗi');
  }

  for (const key of ['glb', 'model', 'data', 'result', 'output', 'mesh']) {
    const value = json[key];
    if (typeof value === 'string' && value.trim()) {
      return normalizeBase64(value);
    }
  }

  throw new Error('AI response không chứa GLB base64');
};

const parseGlbResponse = async (response) => {
  const fileName = `ai-${Date.now()}.glb`;
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length === 0) {
    throw new Error('AI trả về dữ liệu trống');
  }

  // Trả thẳng file GLB nhị phân
  if (isGlbBytes(bytes)) {
    return bytesToGlbFile(bytes, fileName);
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim();
  if (!text) {
    throw new Error('AI trả về dữ liệu trống');
  }

  // JSON string bọc base64: "...."
  if (text.startsWith('"')) {
    const decoded = JSON.parse(text);
    if (typeof decoded !== 'string' || !decoded.trim()) {
      throw new Error('AI trả về base64 rỗng');
    }
    const glbBytes = base64ToBytes(decoded);
    if (!isGlbBytes(glbBytes)) {
      throw new Error('Dữ liệu decode không phải file GLB');
    }
    return bytesToGlbFile(glbBytes, fileName);
  }

  // JSON object
  if (text.startsWith('{')) {
    const json = JSON.parse(text);
    const glbBase64 = extractGlbBase64FromJson(json);
    const glbBytes = base64ToBytes(glbBase64);
    if (!isGlbBytes(glbBytes)) {
      throw new Error('Dữ liệu decode không phải file GLB');
    }
    return bytesToGlbFile(glbBytes, fileName);
  }

  // Chuỗi base64 thuần
  const glbBytes = base64ToBytes(text);
  if (!isGlbBytes(glbBytes)) {
    throw new Error('Dữ liệu decode không phải file GLB');
  }
  return bytesToGlbFile(glbBytes, fileName);
};

/** Gọi trực tiếp API AI → trả File GLB. */
export const generateGlbFromImage = async (imageFile) => {
  const imageBase64 = await fileToBase64(imageFile);

  const response = await fetch(AI_GENERATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let message = errText || `AI generate thất bại (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      message = errJson.text || errJson.error || errJson.message || message;
    } catch {
      // giữ message gốc
    }
    throw new Error(message);
  }

  return parseGlbResponse(response);
};

/** Gọi AI lấy GLB → upload lên BE → trả URL công khai. */
export const generateAndUploadGlbFromImage = async (imageFile) => {
  const glbFile = await generateGlbFromImage(imageFile);
  const uploadRes = await uploadFile(glbFile);
  const data = uploadRes?.data || uploadRes;
  const glbUrl = resolvePublicMediaUrl(data?.publicUrl || data?.url);
  if (!glbUrl) throw new Error('Server không trả về URL file GLB.');
  return { glbUrl, glbFile };
};

/** @deprecated Dùng generateAndUploadGlbFromImage — BE proxy AI. */
export const generateModelFromImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('Image', imageFile);
  const response = await axiosInstance.post('/api/model-generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/** @deprecated OpenRouter flow. */
export const generateModelOpenRouter = async (prompt, imageFile) => {
  const formData = new FormData();
  formData.append('Prompt', prompt);
  formData.append('Image', imageFile);
  const response = await axiosInstance.post('/api/model-generate/openrouter', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
