import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Modal, Spin, Tag, message } from 'antd';
import { createDesignRequest } from '../api/mainflow2Api';
import { uploadFiles } from '../api/fileApi';
import { getActiveServiceOptionsApi } from '../api/serviceApi';

const getDesignWorkId = (response) => {
  const data = response?.data ?? response;
  if (typeof data === 'string') return data;
  return data?.id || data?.Id || data?.designWorkId || data?.DesignWorkId || null;
};

const fileErrorMessage = ({ file, error }) =>
  `${file?.name || 'file'}: ${error?.response?.data?.message || error?.message || 'Upload failed'}`;

const formatVnd = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

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
  const [servicePreviewOpen, setServicePreviewOpen] = useState(false);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [serviceOptionsLoading, setServiceOptionsLoading] = useState(false);

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

  const serviceGroups = useMemo(() => {
    return serviceOptions.reduce((groups, option) => {
      const groupCode = option.groupCode || option.GroupCode || 'OTHER';
      const groupName = option.groupName || option.GroupName || groupCode;
      if (!groups[groupCode]) groups[groupCode] = { groupCode, groupName, options: [] };
      groups[groupCode].options.push(option);
      return groups;
    }, {});
  }, [serviceOptions]);

  const handleOpenServicePreview = async () => {
    setServicePreviewOpen(true);
    if (serviceOptions.length > 0) return;
    try {
      setServiceOptionsLoading(true);
      const res = await getActiveServiceOptionsApi();
      setServiceOptions(res?.data || []);
    } catch (error) {
      console.error(error);
      message.error('Khong tai duoc danh sach dich vu tuy chon.');
    } finally {
      setServiceOptionsLoading(false);
    }
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

    try {
      setIsSubmitting(true);
      const response = await createDesignRequest({
        title: formData.title.trim(),
        requirementBrief: formData.description.trim(),
        initialIdeaImageUrls: formData.imageUrls,
      });

      message.success('Yêu cầu thiết kế đã được gửi.');
      const newId = getDesignWorkId(response);
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
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="m-0 text-sm text-gray-500">
                Xem truoc cac goi/tuy chon shop cung cap cho dich vu thiet ke 3D.
              </p>
              <Button type="primary" onClick={handleOpenServicePreview}>
                Xem dich vu tuy chon
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 leading-relaxed">
          Dịch vụ thiết kế riêng tuân theo{' '}
          <Link to="/policies/custom-design-print" className="font-medium text-indigo-600 no-underline hover:underline">
            chính sách thiết kế & in theo yêu cầu
          </Link>
          .
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

      <Modal
        open={servicePreviewOpen}
        title="Dich vu tuy chon cua shop"
        onCancel={() => setServicePreviewOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setServicePreviewOpen(false)}>
            Dong
          </Button>,
        ]}
        width={760}
      >
        {serviceOptionsLoading ? (
          <div className="py-10 text-center">
            <Spin />
          </div>
        ) : Object.values(serviceGroups).length === 0 ? (
          <p className="text-gray-500 m-0">Shop chua cau hinh dich vu tuy chon nao.</p>
        ) : (
          <div className="space-y-4">
            {Object.values(serviceGroups).map((group) => (
              <div key={group.groupCode} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="m-0 text-base font-semibold text-gray-800">{group.groupName}</h3>
                  <Tag color="blue">{group.options.length} tuy chon</Tag>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.options.map((option) => (
                    <div key={option.id || option.Id} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <div className="font-semibold text-gray-800">{option.name || option.Name}</div>
                      {(option.description || option.Description) && (
                        <div className="mt-1 text-xs text-gray-500">{option.description || option.Description}</div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Tag color="purple">{option.selectionType || option.SelectionType || 'OPTION'}</Tag>
                        {(option.adjustmentRoundDelta || option.AdjustmentRoundDelta) > 0 && (
                          <Tag color="green">+{option.adjustmentRoundDelta || option.AdjustmentRoundDelta} luot sua</Tag>
                        )}
                      </div>
                      <div className="mt-3 text-sm font-bold text-indigo-600">
                        {formatVnd(option.defaultPrice || option.DefaultPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomOrderRequestDesign;
