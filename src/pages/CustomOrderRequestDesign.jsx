import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { createDesignRequest, uploadFile } from '../api/mainflow2Api';

const createImageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const CustomOrderRequestDesign = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [pendingImages]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file) => ({
      id: createImageId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingImages((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    setPendingImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      message.warning('Vui lòng nhập đầy đủ tiêu đề và mô tả!');
      return;
    }

    if (pendingImages.length === 0) {
      message.warning('Vui lòng thêm ít nhất một hình ảnh tham khảo!');
      return;
    }

    try {
      setIsSubmitting(true);

      const imageUrls = [];
      for (const { file } of pendingImages) {
        const res = await uploadFile(file);
        const data = res?.data || res;
        const publicUrl = data?.publicUrl || data?.url;
        if (!publicUrl) throw new Error(`Không lấy được URL cho ${file.name}`);
        imageUrls.push(publicUrl);
      }

      const payload = {
        title: formData.title,
        requirementBrief: formData.description,
        initialIdeaImageUrls: imageUrls,
      };

      const res = await createDesignRequest(payload);
      if (res && res.statusCode === 200) {
        message.success('Yêu cầu thiết kế đã được gửi!');
        const newId = res?.data;
        if (newId && typeof newId === 'string') {
          navigate(`/custom-orders/${newId}`);
        } else {
          navigate('/my-custom-orders');
        }
      } else {
        message.error(res?.message || 'Có lỗi xảy ra khi tạo yêu cầu!');
      }
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Yêu cầu Dịch vụ Thiết kế</h1>

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
            placeholder="Ví dụ: Thiết kế nhân vật anh hùng mini..."
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-800">Hình ảnh tham khảo</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-600 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isSubmitting}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-4xl mb-4">🖼️</div>
              <p className="text-gray-600">
                {pendingImages.length > 0
                  ? `Đã chọn ${pendingImages.length} ảnh — nhấn để thêm ảnh`
                  : 'Nhấn để chọn hình ảnh tham khảo (có thể chọn nhiều ảnh)'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Ảnh sẽ được tải lên khi bạn nhấn &quot;Gửi yêu cầu&quot;
              </p>
            </label>
          </div>
          {pendingImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {pendingImages.map((img) => (
                <div key={img.id} className="relative group bg-gray-200 h-24 rounded overflow-hidden">
                  <img
                    src={img.previewUrl}
                    alt={img.file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    disabled={isSubmitting}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                    aria-label={`Xóa ${img.file.name}`}
                  >
                    ×
                  </button>
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
            placeholder="Vui lòng mô tả chi tiết về mẫu thiết kế bạn mong muốn. Bao gồm kích thước, phong cách, màu sắc, và các yêu cầu cụ thể khác..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 text-white rounded-lg font-semibold transition-colors ${
              isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/custom-order')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomOrderRequestDesign;
