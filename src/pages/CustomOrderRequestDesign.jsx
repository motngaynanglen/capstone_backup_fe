import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { createDesignRequest } from '../api/mainflow2Api';
import { uploadFiles } from '../api/fileApi';
import ServiceOptionPicker from '../components/Mainflow2/ServiceOptionPicker';

const getDesignWorkId = (response) => {
  const data = response?.data ?? response;
  if (typeof data === 'string') return data;
  return data?.id || data?.Id || data?.designWorkId || data?.DesignWorkId || null;
};

const designServiceSelectionKey = (designWorkId) => `design-service-selections:${designWorkId}`;

const fileErrorMessage = ({ file, error }) =>
  `${file?.name || 'file'}: ${error?.response?.data?.message || error?.message || 'Upload failed'}`;

const CustomOrderRequestDesign = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    images: [],
    imageUrls: [],
    description: '',
  });
  const [serviceSelections, setServiceSelections] = useState([]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviewUrls(files.map((file) => URL.createObjectURL(file)));
    setFormData((current) => ({ ...current, images: files, imageUrls: [] }));
    setUploadingImages(true);

    try {
      const { results, errors } = await uploadFiles(files, { expectedType: 'image' });
      const urls = results.map((item) => item.url);

      setFormData((current) => ({
        ...current,
        images: results.map((item) => item.file),
        imageUrls: urls,
      }));

      if (urls.length > 0) {
        message.success(`Đã upload ${urls.length}/${files.length} ảnh.`);
      }

      if (errors.length > 0) {
        message.error({
          content: `Có ${errors.length} ảnh upload thất bại. ${fileErrorMessage(errors[0])}`,
          duration: 6,
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      message.warning('Vui lòng nhập đầy đủ tiêu đề và mô tả.');
      return;
    }

    if (uploadingImages) {
      message.warning('Ảnh đang upload, vui lòng đợi hoàn tất.');
      return;
    }

    if (formData.imageUrls.length === 0) {
      message.warning('Vui lòng upload ít nhất một ảnh tham khảo.');
      return;
    }

    if (serviceSelections.length === 0) {
      message.warning('Vui long chon it nhat mot tuy chon dich vu thiet ke.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createDesignRequest({
        title: formData.title.trim(),
        requirementBrief: formData.description.trim(),
        initialIdeaImageUrls: formData.imageUrls,
        serviceOptions: serviceSelections,
      });

      message.success('Yêu cầu thiết kế đã được gửi.');
      const newId = getDesignWorkId(response);
      if (newId) {
        sessionStorage.setItem(designServiceSelectionKey(newId), JSON.stringify(serviceSelections));
      }
      navigate(newId ? `/custom-orders/${newId}` : '/my-custom-orders');
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || error?.response?.data?.data || error?.message || 'Tạo yêu cầu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Yêu cầu dịch vụ thiết kế</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-800">Tiêu đề yêu cầu</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
            placeholder="Ví dụ: Thiết kế nhân vật mini..."
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-800">Hình ảnh tham khảo</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-600 transition-colors">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,image/*"
              multiple
              onChange={handleImageChange}
              disabled={uploadingImages}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className={uploadingImages ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}>
              <div className="text-4xl mb-4">Ảnh</div>
              <p className="text-gray-600">
                {uploadingImages
                  ? 'Đang upload ảnh...'
                  : formData.imageUrls.length > 0
                    ? `Đã upload ${formData.imageUrls.length} ảnh`
                    : 'Bấm để chọn ảnh tham khảo'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hỗ trợ JPG, PNG, WEBP, GIF, BMP, SVG. Tối đa 20MB/file.
              </p>
            </label>
          </div>
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {imagePreviewUrls.map((src, idx) => (
                <div key={src} className="bg-gray-200 h-24 rounded overflow-hidden border border-gray-200">
                  <img src={src} alt={formData.images[idx]?.name || 'preview'} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-800">Mô tả chi tiết</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="8"
            required
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
            placeholder="Mô tả kích thước, phong cách, màu sắc, yêu cầu riêng..."
          />
        </div>

        <div className="mb-6">
          <label className="block mb-3 font-medium text-gray-800">Chọn tùy chọn dịch vụ</label>
          <ServiceOptionPicker value={serviceSelections} onChange={setServiceSelections} />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || uploadingImages}
            className={`flex-1 py-3 text-white rounded-lg font-semibold transition-colors ${
              isSubmitting || uploadingImages ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? 'Đang gửi...' : uploadingImages ? 'Đang upload ảnh...' : 'Gửi yêu cầu'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/custom-order')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomOrderRequestDesign;
