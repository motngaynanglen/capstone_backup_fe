import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message, Modal, Spin, Switch } from "antd";
import designTemplateApi from "../../api/designTemplateApi";
import TemplateFormModal from "../../components/Staff/TemplateFormModal";

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
];

const StaffTemplateManagement = ({
  basePath = "/staff/templates",
  title = "Quản lý mẫu thiết kế",
  subtitle = "Publish/unpublish, thêm, sửa và xóa mềm mẫu thiết kế 3D",
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 1,
  });
  const [templateModal, setTemplateModal] = useState({ open: false, templateId: null });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTemplates = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        includeInactive: true,
      };

      const response = await designTemplateApi.manageCatalog(params);
      let items = response.data || [];

      if (statusFilter === "published") {
        items = items.filter((t) => t.isActive);
      } else if (statusFilter === "draft") {
        items = items.filter((t) => !t.isActive);
      }

      setTemplates(items);

      const meta = response.additionalData?.pagination || {};
      setPagination((prev) => ({
        ...prev,
        pageNumber: meta.pageNumber || page,
        totalCount: meta.totalCount ?? items.length,
        totalPages: meta.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách mẫu thiết kế");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pagination.pageSize, statusFilter]);

  useEffect(() => {
    fetchTemplates(1);
  }, [fetchTemplates]);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    setTemplateModal({ open: true, templateId: null });
    searchParams.delete("action");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const detailPath = (templateId) => `${basePath}/${templateId}`;

  const handleTogglePublish = async (template, nextActive) => {
    try {
      setActionId(template.id);
      const response = await designTemplateApi.toggleActive(template.id);
      if (response.code === "SUCCESS") {
        message.success(response.message || (nextActive ? "Đã publish" : "Đã unpublish"));
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === template.id ? { ...t, isActive: response.data?.isActive ?? nextActive } : t
          )
        );
      } else {
        message.error(response.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = (template) => {
    Modal.confirm({
      title: "Xóa mẫu thiết kế",
      content: `Bạn có chắc muốn xóa mềm mẫu "${template.name}"? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setActionId(template.id);
          const response = await designTemplateApi.delete(template.id);
          if (response.code === "SUCCESS") {
            message.success("Đã xóa mẫu thiết kế");
            fetchTemplates(pagination.pageNumber);
          } else {
            message.error(response.message || "Xóa thất bại");
          }
        } catch (error) {
          message.error(error.response?.data?.message || "Xóa thất bại");
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const openCreateModal = () => setTemplateModal({ open: true, templateId: null });
  const openEditModal = (templateId) => setTemplateModal({ open: true, templateId });
  const closeTemplateModal = () => setTemplateModal({ open: false, templateId: null });

  const handleTemplateSaved = (savedId, isEdit) => {
    fetchTemplates(pagination.pageNumber);
    if (!isEdit && savedId) {
      Modal.confirm({
        title: "Tạo mẫu thành công",
        content: "Bạn có muốn mở trang chi tiết để thêm biến thể ngay không?",
        okText: "Thêm biến thể",
        cancelText: "Ở lại danh sách",
        onOk: () => navigate(detailPath(savedId)),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusIcon />
            Thêm mẫu mới
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </div>
            </div>

            <div className="flex gap-2">
              {STATUS_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                  style={{ opacity: template.isActive ? 1 : 0.6 }}
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-mono">{template.code}</p>
                        <h3 className="font-semibold text-gray-800 truncate">{template.name}</h3>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                        {template.variantCount ?? 0} biến thể
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {template.description || "Chưa có mô tả"}
                    </p>

                    {template.conceptTagNames?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.conceptTagNames.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      className="flex items-center justify-between mb-3 py-2 px-3 bg-gray-50 rounded-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm text-gray-600">
                        {template.isActive ? "Đang hiển thị" : "Đang ẩn (Draft)"}
                      </span>
                      <Switch
                        checked={template.isActive}
                        loading={actionId === template.id}
                        onChange={(checked) => handleTogglePublish(template, checked)}
                        checkedChildren="ON"
                        unCheckedChildren="OFF"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(detailPath(template.id))}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <EyeIcon />
                        Chi tiết
                      </button>
                      <button
                        onClick={() => openEditModal(template.id)}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        disabled={actionId === template.id}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="Xóa mềm"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {templates.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">Không tìm thấy mẫu thiết kế nào</p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Thêm mẫu đầu tiên
                </button>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  disabled={pagination.pageNumber <= 1}
                  onClick={() => fetchTemplates(pagination.pageNumber - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Trang {pagination.pageNumber} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.pageNumber >= pagination.totalPages}
                  onClick={() => fetchTemplates(pagination.pageNumber + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <TemplateFormModal
        open={templateModal.open}
        templateId={templateModal.templateId}
        onClose={closeTemplateModal}
        onSuccess={handleTemplateSaved}
      />
    </div>
  );
};

export default StaffTemplateManagement;
