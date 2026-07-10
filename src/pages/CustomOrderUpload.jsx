import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import materialApi from '../api/materialApi';
import { uploadFile, createCustomFilePrintRequest } from '../api/mainflow2Api';

const ALLOWED_EXT = ['.stl', '.obj'];

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
  const [uploadedFile, setUploadedFile] = useState(null); // { name, publicUrl }
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({
    file: null,
    materialId: '',
    technicalRequirements: '',
    note: '',
    title: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await materialApi.getAll();
        const list = res?.data || [];
        setMaterials(list);
        if (list.length > 0) setFormData((f) => ({ ...f, materialId: list[0].id }));
      } catch (e) {
        console.error('Lỗi tải vật liệu:', e);
      }
    })();
  }, []);

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
        description: 'Chỉ chấp nhận file .stl hoặc .obj',
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
      setFormData((f) => ({ ...f, file, title: f.title || file.name }));
      notification.success({
        message: 'Tải file thành công',
        description: file.name,
        duration: 2,
      });
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
      notification.warning({ message: 'Bạn cần tải lên file STL/OBJ trước.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title || uploadedFile.name,
        customerFileUrl: uploadedFile.publicUrl,
        materialId: formData.materialId || undefined,
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
        description: 'Kỹ thuật viên sẽ xem xét và báo giá. Bạn có thể chat trực tiếp ngay sau đây.',
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
          Tải file STL/OBJ của bạn. Kỹ thuật viên sẽ duyệt mesh, kiểm tra wall thickness và gửi báo giá ngay trên hệ thống.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-800">File 3D (STL/OBJ)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".stl,.obj"
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
              <p className="text-xs text-gray-500 mt-2">Chỉ hỗ trợ .stl, .obj — tối đa 20MB</p>
              {uploadedFile && (
                <a
                  href={uploadedFile.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 text-xs text-indigo-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Mở file đã upload
                </a>
              )}
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
            <label className="block mb-2 font-medium text-gray-800">Vật liệu mong muốn</label>
            <select
              name="materialId"
              value={formData.materialId}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Để KTV tư vấn —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-800">Yêu cầu kỹ thuật</label>
          <textarea
            name="technicalRequirements"
            value={formData.technicalRequirements}
            onChange={handleChange}
            rows={3}
            placeholder="VD: layer height 0.2mm, in nhiều màu, độ phân giải cao..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-800">Ghi chú thêm</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={3}
            placeholder="Bạn muốn nhận sản phẩm khi nào? Có yêu cầu đặc biệt gì không?"
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

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

      <div className="mt-6 rounded-2xl bg-indigo-50 border border-indigo-100 p-5 text-sm text-indigo-900">
        <p className="font-semibold mb-1">Quy trình sau khi gửi:</p>
        <ol className="list-decimal pl-5 space-y-1 text-indigo-800">
          <li>KTV nhận yêu cầu & kiểm duyệt file (mesh, wall thickness).</li>
          <li>KTV gửi báo giá — bạn chat thương lượng nếu cần.</li>
          <li>Khi bạn duyệt giá, hệ thống tạo đơn hàng + link thanh toán PayOS.</li>
          <li>Theo dõi tiến độ in 3D & giao hàng trực tiếp tại "Đơn theo yêu cầu".</li>
        </ol>
      </div>
    </div>
  );
};

export default CustomOrderUpload;
