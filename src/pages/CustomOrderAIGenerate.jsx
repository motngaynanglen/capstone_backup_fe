import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@google/model-viewer';
import { notification } from 'antd';
import { generateAndUploadGlbFromImage } from '../api/modelApi';
import { uploadFile, createAiPrintRequest } from '../api/mainflow2Api';

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CustomOrderAIGenerate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('generate');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState('');

  const [glbUrl, setGlbUrl] = useState(null);
  const [sourceImageUrl, setSourceImageUrl] = useState(null);

  const handleImagePick = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      notification.warning({ message: 'Chọn ảnh tham khảo cho AI.' });
      return;
    }
    setGenerating(true);
    try {
      const { glbUrl: url } = await generateAndUploadGlbFromImage(imageFile);
      setGlbUrl(url);

      setUploadingRef(true);
      try {
        const up = await uploadFile(imageFile);
        const pub = up?.data?.publicUrl || up?.data?.url || up?.publicUrl;
        if (pub) setSourceImageUrl(pub);
      } catch (upErr) {
        console.warn('Không upload ảnh tham khảo:', upErr);
      } finally {
        setUploadingRef(false);
      }

      setStep('preview');
      notification.success({
        message: 'Đã tạo mô hình 3D',
        description: 'Xem preview và gửi cho kỹ thuật viên báo giá.',
      });
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Tạo mô hình thất bại',
        description: err?.response?.data?.message || err?.response?.data?.data || err.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitForQuote = async () => {
    if (!glbUrl) {
      notification.warning({ message: 'Chưa có file GLB.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await createAiPrintRequest({
        title: title.trim() || undefined,
        modelFileUrl: glbUrl,
        sourceImageUrl: sourceImageUrl || undefined,
      });
      const designWorkId = res?.data ?? res;
      if (!designWorkId || typeof designWorkId === 'object') {
        throw new Error('Không nhận được mã yêu cầu từ server.');
      }
      notification.success({
        message: 'Đã gửi yêu cầu báo giá',
        description: 'KTV sẽ xem GLB, báo giá in — bạn chat & duyệt giá như đơn custom khác.',
      });
      navigate(`/custom-orders/${designWorkId}`);
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Gửi yêu cầu thất bại',
        description: err?.response?.data?.message || err?.response?.data?.data || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">AI tạo mẫu 3D (Flow 3)</h1>
        <p className="text-sm text-gray-500">
          Upload 1 ảnh → AI sinh GLB → kỹ thuật viên báo giá in → thanh toán → sản xuất & giao hàng (giống flow 2).
        </p>
      </div>

      {step === 'generate' && (
        <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-800">Ảnh tham khảo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-violet-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="ai-image"
                onChange={(e) => handleImagePick(e.target.files?.[0])}
              />
              <label htmlFor="ai-image" className="cursor-pointer block">
                {imagePreview ? (
                  <img src={imagePreview} alt="Tham khảo" className="mx-auto max-h-48 rounded-lg object-contain" />
                ) : (
                  <>
                    <div className="text-4xl mb-3">🤖</div>
                    <p className="text-gray-600">Chọn ảnh để AI tạo mô hình 3D</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-900">
            <p className="font-semibold mb-1">Sau khi có GLB:</p>
            <p>KTV xem file, báo giá chi tiết (vật liệu, gram, tiền công). Bạn duyệt → thanh toán → in 3D & GHN.</p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={generating || !imageFile}
              className="flex-1 inline-flex items-center justify-center py-3 rounded-xl font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {generating ? <><SpinnerIcon /> Đang tạo GLB & lưu lên server...</> : 'Tạo mô hình 3D'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/custom-order')}
              className="px-6 py-3 bg-gray-100 rounded-xl font-semibold"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {step === 'preview' && glbUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Preview mô hình AI</h2>
          <div className="rounded-xl border border-violet-100 bg-slate-50 overflow-hidden" style={{ height: 360 }}>
            <model-viewer
              src={glbUrl}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              environment-image="neutral"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <p className="text-xs text-gray-500 break-all">
            GLB: <a href={glbUrl} target="_blank" rel="noreferrer" className="text-violet-600">{glbUrl}</a>
          </p>

          <div>
            <label className="block mb-2 font-medium text-gray-800">Tên dự án (tuỳ chọn)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl"
              placeholder="VD: Móc khóa AI"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              disabled={submitting || uploadingRef}
              onClick={handleSubmitForQuote}
              className="flex-1 min-w-[200px] py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center"
            >
              {submitting ? <><SpinnerIcon /> Đang gửi...</> : 'Gửi KTV báo giá'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('generate'); setGlbUrl(null); }}
              className="px-6 py-3 bg-gray-100 rounded-xl font-semibold"
            >
              Tạo lại
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-indigo-50 border border-indigo-100 p-5 text-sm text-indigo-900">
        <p className="font-semibold mb-1">Quy trình Flow 3:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>AI tạo GLB từ ảnh bạn upload.</li>
          <li>KTV tiếp nhận, báo giá từ file GLB (chat nếu cần).</li>
          <li>Bạn duyệt giá → thanh toán PayOS.</li>
          <li>In 3D → giao hàng GHN (theo dõi như flow 2).</li>
        </ol>
      </div>
    </div>
  );
};

export default CustomOrderAIGenerate;
