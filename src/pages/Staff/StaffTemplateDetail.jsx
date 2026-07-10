import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Spin, Switch, Tag } from "antd";
import designTemplateApi from "../../api/designTemplateApi";
import designTagApi from "../../api/designTagApi";
import designVariantApi from "../../api/designVariantApi";
import TemplateFormModal from "../../components/Staff/TemplateFormModal";
import VariantFormModal from "../../components/Staff/VariantFormModal";
import GlbPreview from "../../components/Mainflow2/GlbPreview";
import { getModel3dKind } from "../../utils/model3d";
import { resolvePublicMediaUrl } from "../../utils/mediaUrl";

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
};

const StaffTemplateDetail = ({ basePath = "/staff/templates" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [tags, setTags] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [togglingVariantId, setTogglingVariantId] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [variantModal, setVariantModal] = useState({ open: false, variant: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailRes, tagsRes, variantsRes] = await Promise.all([
        designTemplateApi.getDetail(id),
        designTagApi.getTags(id),
        designVariantApi.getAll({ designTemplateId: id }),
      ]);

      setTemplate(detailRes.data);
      setTags(tagsRes.data || []);
      setVariants(variantsRes.data || []);
    } catch (error) {
      message.error("Không thể tải chi tiết mẫu thiết kế");
      navigate(basePath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleActive = async (checked) => {
    try {
      setToggling(true);
      const response = await designTemplateApi.toggleActive(id);
      if (response.code === "SUCCESS") {
        message.success(response.message || (checked ? "Đã publish" : "Đã unpublish"));
        setTemplate(response.data);
      } else {
        message.error(response.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setToggling(false);
    }
  };

  const handleToggleVariantActive = async (variant) => {
    try {
      setTogglingVariantId(variant.id);
      const response = await designVariantApi.toggleActive(variant.id);
      if (response.code === "SUCCESS") {
        message.success(response.message || "Đã thay đổi trạng thái biến thể");
        fetchData();
      } else {
        message.error(response.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setTogglingVariantId(null);
    }
  };

  const openAddVariant = () => setVariantModal({ open: true, variant: null });
  const openEditVariant = (variant) => setVariantModal({ open: true, variant });
  const closeVariantModal = () => setVariantModal({ open: false, variant: null });

  if (loading || !template) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate(basePath)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors self-start"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-mono">{template.code}</p>
            <h1 className="text-2xl font-bold text-gray-800">{template.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <EditIcon />
              Chỉnh sửa mẫu
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <span className="text-sm text-gray-600">
                {template.isActive ? "Hiển thị cửa hàng" : "Draft (ẩn)"}
              </span>
              <Switch
                checked={template.isActive}
                loading={toggling}
                onChange={handleToggleActive}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-12 gap-6 transition-opacity"
          style={{ opacity: template.isActive ? 1 : 0.6 }}
        >
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>Chưa có thumbnail</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Thông tin mẫu</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Trạng thái</span>
                  <Switch
                    checked={template.isActive}
                    loading={toggling}
                    onChange={handleToggleActive}
                    size="small"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày tạo</span>
                  <span className="text-gray-800">{formatDate(template.created)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số biến thể</span>
                  <span className="text-gray-800">{variants.length}</span>
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">Tags</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-gray-500 text-sm">Mô tả</span>
                <p className="text-gray-800 mt-1">{template.description || "Chưa có mô tả"}</p>
              </div>

              {template.fileUrl && (
                <div>
                  <span className="text-gray-500 text-sm">File 3D (GLB)</span>
                  {getModel3dKind(resolvePublicMediaUrl(template.fileUrl)) === "gltf" ? (
                    <div className="mt-2">
                      <GlbPreview src={template.fileUrl} height={200} style={{ borderRadius: 12 }} />
                    </div>
                  ) : (
                    <a
                      href={template.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 text-sm mt-1 break-all hover:underline"
                    >
                      {template.fileUrl}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Danh sách biến thể</h4>
                <button
                  onClick={openAddVariant}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <PlusIcon />
                  Thêm biến thể
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-500 text-sm mb-3">Chưa có biến thể nào</p>
                  <button
                    onClick={openAddVariant}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-sm font-medium"
                  >
                    + Thêm biến thể đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="p-4 rounded-xl border bg-white border-gray-200 transition-opacity"
                      style={{ opacity: variant.isActive ? 1 : 0.6 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-xs text-gray-400">{variant.code}</p>
                            {variant.materialName && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                {variant.materialName}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-800 mt-1">{variant.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                            <span>Giá: {(variant.price ?? 0).toLocaleString()}đ</span>
                            <span>Tồn: {variant.stockQuantity ?? 0}</span>
                            {variant.estimatedWeightPerUnit != null && (
                              <span>~{variant.estimatedWeightPerUnit}g</span>
                            )}
                            {variant.isAllowPreOrder && (
                              <span className="text-blue-500">Pre-order</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={variant.isActive}
                            loading={togglingVariantId === variant.id}
                            onChange={() => handleToggleVariantActive(variant)}
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                            size="small"
                          />
                          {!variant.isActive && <Tag color="default">Đã tắt</Tag>}
                          <button
                            onClick={() => openEditVariant(variant)}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            title="Sửa"
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TemplateFormModal
        open={templateModalOpen}
        templateId={id}
        onClose={() => setTemplateModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <VariantFormModal
        open={variantModal.open}
        templateId={id}
        variant={variantModal.variant}
        onClose={closeVariantModal}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};

export default StaffTemplateDetail;
