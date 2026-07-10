import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Divider, message, Spin } from "antd";
import designTemplateApi from "../../api/designTemplateApi";
import conceptTagApi from "../../api/conceptTagApi";
import designTagApi from "../../api/designTagApi";
import ProductFileUpload from "../Manager/ProductFileUpload";
import { fileLabel } from "../../utils/variantMedia";

const { TextArea } = Input;

const TemplateFormModal = ({ open, templateId, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedMainTagId, setSelectedMainTagId] = useState(null);
  const [selectedRegularTagIds, setSelectedRegularTagIds] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState("");
  const [modelFileUrl, setModelFileUrl] = useState("");
  const [modelFileName, setModelFileName] = useState("");
  const isEditMode = Boolean(templateId);

  useEffect(() => {
    if (!open) return;

    const init = async () => {
      setLoading(true);
      try {
        const tagsResponse = await conceptTagApi.getAll();
        const allTags = tagsResponse.data || [];
        setAvailableTags(allTags);
        setSelectedMainTagId(null);
        setSelectedRegularTagIds([]);
        form.resetFields();
        setThumbnailUrl("");
        setThumbnailFileName("");
        setModelFileUrl("");
        setModelFileName("");

        if (isEditMode) {
          const [detailRes, tagsRes] = await Promise.all([
            designTemplateApi.getDetail(templateId),
            designTagApi.getTags(templateId),
          ]);
          const data = detailRes.data;
          form.setFieldsValue({
            code: data.code,
            name: data.name,
            description: data.description,
          });
          setThumbnailUrl(data.thumbnailUrl || "");
          setThumbnailFileName(data.thumbnailUrl ? fileLabel(data.thumbnailUrl) : "");
          if (data.fileUrl) {
            setModelFileUrl(data.fileUrl);
            setModelFileName(fileLabel(data.fileUrl));
          }

          const templateTags = tagsRes.data || [];
          const resolveTagId = (name) =>
            allTags.find((a) => a.name === name)?.id;

          const mainTemplateTag = templateTags.find((t) => t.isMainTag);
          setSelectedMainTagId(
            mainTemplateTag ? resolveTagId(mainTemplateTag.name) || null : null
          );
          setSelectedRegularTagIds(
            templateTags
              .filter((t) => !t.isMainTag)
              .map((t) => resolveTagId(t.name))
              .filter(Boolean)
          );
        }
      } catch (error) {
        message.error("Không thể tải dữ liệu mẫu thiết kế");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [open, templateId, isEditMode, form, onClose]);

  const mainTags = availableTags.filter((t) => t.isMainTag);
  const regularTags = availableTags.filter((t) => !t.isMainTag);

  const toggleMainTag = (tagId) => {
    setSelectedMainTagId((prev) => (prev === tagId ? null : tagId));
  };

  const toggleRegularTag = (tagId) => {
    setSelectedRegularTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const syncTags = async (id) => {
    const tags = [
      ...(selectedMainTagId
        ? [{ conceptTagId: selectedMainTagId, isMainTag: true }]
        : []),
      ...selectedRegularTagIds.map((tagId) => ({
        conceptTagId: tagId,
        isMainTag: false,
      })),
    ];

    await designTagApi.syncTags({
      designTemplateId: id,
      tags,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!modelFileUrl?.trim()) {
        message.warning("Vui lòng tải lên file GLB mẫu thiết kế");
        return;
      }
      if (!thumbnailUrl?.trim()) {
        message.warning("Vui lòng tải lên ảnh thumbnail");
        return;
      }

      setSubmitting(true);

      const payload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: (values.description || "").trim(),
        fileUrl: modelFileUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
      };

      let resultId = templateId;
      if (isEditMode) {
        const response = await designTemplateApi.update(templateId, payload);
        if (response.code !== "SUCCESS") throw new Error(response.message);
        message.success("Cập nhật mẫu thiết kế thành công");
        resultId = response.data?.id || templateId;
      } else {
        const response = await designTemplateApi.add(payload);
        if (response.code !== "SUCCESS") throw new Error(response.message);
        message.success("Tạo mẫu thành công — trạng thái Draft");
        resultId = response.data?.id;
      }

      if (resultId) await syncTags(resultId);
      onSuccess?.(resultId, isEditMode);
      onClose();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || error.message || "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? "Chỉnh sửa mẫu thiết kế" : "Thêm mẫu thiết kế mới"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditMode ? "Lưu thay đổi" : "Tạo mẫu"}
      cancelText="Hủy"
      confirmLoading={submitting}
      width={680}
      destroyOnClose
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark="optional">
          <Divider orientation="left" plain style={{ marginTop: 0 }}>
            Thông tin cơ bản
          </Divider>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="code"
              label="Mã mẫu"
              rules={[
                { required: true, message: "Nhập mã mẫu" },
                { pattern: /^[A-Za-z0-9-]+$/, message: "Chỉ chữ, số và dấu gạch ngang" },
              ]}
            >
              <Input
                placeholder="VD: FIG-003"
                style={{ textTransform: "uppercase" }}
                onChange={(e) => form.setFieldValue("code", e.target.value.toUpperCase())}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên mẫu"
              rules={[{ required: true, message: "Nhập tên mẫu" }]}
            >
              <Input placeholder="Tên mẫu thiết kế" maxLength={200} showCount />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả ngắn về mẫu thiết kế..." />
          </Form.Item>

          <Divider orientation="left" plain>
            File & hình ảnh
          </Divider>

          <ProductFileUpload
            label="File GLB mẫu thiết kế"
            required
            hint="Upload file .glb — dùng làm mô hình 3D hiển thị trên cửa hàng."
            accept=".glb,model/gltf-binary"
            allowedLabel=".glb"
            previewType="model"
            value={modelFileUrl}
            fileName={modelFileName}
            onChange={(url, name) => {
              setModelFileUrl(url || "");
              setModelFileName(name || "");
            }}
            className="mb-4"
          />

          <ProductFileUpload
            label="Ảnh thumbnail"
            required
            hint="Upload ảnh đại diện hiển thị trên cửa hàng (.png, .jpg, .webp)."
            accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
            allowedLabel=".png, .jpg, .webp"
            previewType="image"
            value={thumbnailUrl}
            fileName={thumbnailFileName}
            onChange={(url, name) => {
              setThumbnailUrl(url || "");
              setThumbnailFileName(name || "");
            }}
            className="mb-4"
          />

          {(mainTags.length > 0 || regularTags.length > 0) && (
            <>
              <Divider orientation="left" plain>
                Tags phân loại
              </Divider>

              {mainTags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Danh mục chính (Main Tag)
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    Chọn 1 danh mục chính để phân loại sản phẩm trên cửa hàng.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mainTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleMainTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                          selectedMainTagId === tag.id
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {regularTags.length > 0 && (
                <div className="pb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Thẻ phân loại
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    Chọn thêm các thẻ mô tả chi tiết (có thể chọn nhiều).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {regularTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleRegularTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                          selectedRegularTagIds.includes(tag.id)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!isEditMode && (
            <p className="text-xs text-gray-400 mt-2">
              Mẫu mới sẽ ở trạng thái Draft. Publish sau khi đã thêm biến thể.
            </p>
          )}
        </Form>
      )}
    </Modal>
  );
};

export default TemplateFormModal;
