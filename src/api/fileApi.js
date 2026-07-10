import axiosInstance from './axiosInstance';

/**
 * POST /api/files/upload — trả { data: { url, fileName, size } }
 */
export async function uploadPublicFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export function extractUploadUrl(res) {
  const data = res?.data ?? res;
  return data?.url || data?.publicUrl || null;
}
