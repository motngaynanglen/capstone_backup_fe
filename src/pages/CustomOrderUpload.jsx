import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { uploadFile, createCustomFilePrintRequest } from '../api/mainflow2Api';

const ALLOWED_EXT = ['.stl', '.obj', '.glb'];

const formatPrintSize = ({ length, width, height }) => {
  const parts = [length, width, height].map((v) => v?.trim()).filter(Boolean);
  return parts.length ? `${parts.join('×')} cm` : '';
};

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CustomOrderUpload = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    quantity: 1,
    printSizeLength: '',
    printSizeWidth: '',
    printSizeHeight: '',
    technicalRequirements: '',
    note: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleFile = async (file) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(`.${ext}`)) {
      notification.error({
        message: 'Định dạng không hỗ trợ',
        description: 'Chỉ chấp nhận file .stl, .obj hoặc .glb',
      });
      return;
    }
    try {
      setUploadingFile(true);
      const res = await uploadFile(file);
      const data = res?.data || res;
      const publicUrl = data?.publicUrl || data?.url;
      if (!publicUrl) throw new Error('Server không trả về URL file.');
      setUploadedFile({ name: file.name, publicUrl });
      setFormData((f) => ({ ...f, title: f.title || file.name }));
      notification.success({ message: 'Tải file thành công', description: file.name, duration: 2 });
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Tải file thất bại',
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile?.publicUrl) {
      notification.warning({ message: 'Bạn cần tải lên file 3D trước.' });
      return;
    }
    setSubmitting(true);
    try {
      const printSize = formatPrintSize({
        length: formData.printSizeLength,
        width: formData.printSizeWidth,
        height: formData.printSizeHeight,
      });
      const payload = {
        title: formData.title || uploadedFile.name,
        customerFileUrl: uploadedFile.publicUrl,
        quantity: Number(formData.quantity) || 1,
        printSize: printSize || undefined,
        technicalRequirements: formData.technicalRequirements || undefined,
        note: formData.note || undefined,
      };
      const res = await createCustomFilePrintRequest(payload);
      const designWorkId = res?.data || res;
      if (!designWorkId || typeof designWorkId === 'object') {
        throw new Error('Không nhận được DesignWorkId từ server.');
      }
      notification.success({
        message: 'Đã gửi yêu cầu in 3D',
        description: 'Manager sẽ giao việc cho kỹ thuật viên báo giá. Bạn có thể chat ngay sau đây.',
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
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Đăng tải File 3D</h1>
        <p className="text-sm text-gray-500">
          Tải file STL/OBJ/GLB. Mô tả nhu cầu in — kỹ thuật viên sẽ chọn vật liệu và báo giá phù hợp.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-800">File 3D (STL / OBJ / GLB)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".stl,.obj,.glb"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
              id="file-upload"
              disabled={uploadingFile}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="text-4xl mb-3">{uploadedFile ? '✅' : '📁'}</div>
              <p className="text-gray-600 font-medium">
                {uploadingFile ? 'Đang tải file lên...' :
                  uploadedFile ? uploadedFile.name : 'Nhấn để tải lên hoặc kéo thả file vào đây'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Hỗ trợ .stl, .obj, .glb</p>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-gray-800">Tên dự án (tuỳ chọn)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Mô hình móc khóa"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-800">Số lượng in</label>
            <input
              type="number"
              name="quantity"
              min={1}
              max={99}
              value={formData.quantity}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2 font-medium text-gray-800">Kích thước in (tuỳ chọn)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'printSizeLength', label: 'Dài' },
                { name: 'printSizeWidth', label: 'Rộng' },
                { name: 'printSizeHeight', label: 'Cao' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <span className="block text-xs text-gray-500 mb-1">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name={name}
                      min={0}
                      step="0.1"
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                    <span className="shrink-0 text-sm font-medium text-gray-600">cm</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Nhập kích thước mong muốn theo đơn vị centimet (cm).</p>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-800">Yêu cầu kỹ thuật (tuỳ chọn)</label>
          <textarea
            name="technicalRequirements"
            value={formData.technicalRequirements}
            onChange={handleChange}
            rows={2}
            placeholder="VD: layer height 0.2mm, in nhiều màu..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-800">Ghi chú thêm</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={2}
            placeholder="Thời gian cần hàng, yêu cầu đặc biệt..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
          Bạn không cần chọn vật liệu — kỹ thuật viên sẽ tư vấn vật liệu phù hợp khi báo giá.
        </p>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || uploadingFile || !uploadedFile}
            className={`flex-1 inline-flex items-center justify-center py-3 rounded-xl font-semibold ${
              submitting || uploadingFile || !uploadedFile
                ? 'bg-indigo-300 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {submitting ? <><SpinnerIcon /> Đang gửi...</> : 'Gửi yêu cầu báo giá'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/custom-order')}
            className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200"
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomOrderUpload;
