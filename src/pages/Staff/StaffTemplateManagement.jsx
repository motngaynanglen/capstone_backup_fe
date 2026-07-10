import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ---------------- MOCK DATA ---------------- */

const mockTemplates = [
    {
        id: "TPL001",
        code: "FIG-001",
        name: "Chibi Character Base",
        description: "Mẫu nhân vật chibi cơ bản để customize",
        thumbnail: "/thumbnails/chibi-base.png",
        fileUrl: "/models/chibi-base.stl",
        status: "published",
        variantCount: 3,
        createdAt: "2026-01-10",
        updatedAt: "2026-01-15",
    },
    {
        id: "TPL002",
        code: "KEY-001",
        name: "Keychain Round Base",
        description: "Móc khóa tròn với vòng treo",
        thumbnail: "/thumbnails/keychain-round.png",
        fileUrl: "/models/keychain-round.stl",
        status: "published",
        variantCount: 5,
        createdAt: "2026-01-08",
        updatedAt: "2026-01-12",
    },
    {
        id: "TPL003",
        code: "CASE-001",
        name: "Phone Case iPhone 15",
        description: "Ốp lưng iPhone 15 Pro Max",
        thumbnail: "/thumbnails/case-iphone15.png",
        fileUrl: "/models/case-iphone15.stl",
        status: "draft",
        variantCount: 2,
        createdAt: "2026-01-05",
        updatedAt: "2026-01-05",
    },
    {
        id: "TPL004",
        code: "FIG-002",
        name: "Action Figure Pose A",
        description: "Mẫu action figure pose chiến đấu",
        thumbnail: "/thumbnails/action-pose-a.png",
        fileUrl: "/models/action-pose-a.stl",
        status: "archived",
        variantCount: 0,
        createdAt: "2025-12-20",
        updatedAt: "2026-01-01",
    },
];

const mockConceptTags = [
    { id: 1, name: "Anime" },
    { id: 2, name: "Gaming" },
    { id: 3, name: "Cute" },
    { id: 4, name: "Realistic" },
    { id: 5, name: "Abstract" },
];

/* ---------------- ICONS ---------------- */

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

const ArchiveIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);

/* ---------------- COMPONENT ---------------- */

const StaffTemplateManagement = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState(mockTemplates);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter templates
    const filteredTemplates = templates.filter((t) => {
        const matchSearch =
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            published: "bg-green-100 text-green-700",
            draft: "bg-yellow-100 text-yellow-700",
            archived: "bg-gray-100 text-gray-600",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handleArchive = (id) => {
        setTemplates((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: t.status === "archived" ? "draft" : "archived" } : t))
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Quản lý mẫu thiết kế</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý thư viện mẫu thiết kế 3D và các biến thể</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        <PlusIcon />
                        Thêm mẫu mới
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
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

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            {["all", "published", "draft", "archived"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === status
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {status === "all" ? "Tất cả" : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(template.status)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-xs text-gray-400 font-mono">{template.code}</p>
                                        <h3 className="font-semibold text-gray-800">{template.name}</h3>
                                    </div>
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                        {template.variantCount} biến thể
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{template.description}</p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/staff/templates/${template.id}`)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                                    >
                                        <EyeIcon />
                                        Xem chi tiết
                                    </button>
                                    <button
                                        onClick={() => navigate(`/staff/templates/${template.id}/edit`)}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        onClick={() => handleArchive(template.id)}
                                        className={`px-3 py-2 rounded-xl transition-colors ${template.status === "archived"
                                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        <ArchiveIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">Không tìm thấy mẫu thiết kế nào</p>
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <AddTemplateModal onClose={() => setShowAddModal(false)} />
                )}
            </div>
        </div>
    );
};

/* ---------------- ADD TEMPLATE MODAL ---------------- */

const AddTemplateModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        file: null,
        tags: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Creating template:", formData);
        alert("Tạo mẫu thành công!");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Thêm mẫu thiết kế mới</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã mẫu</label>
                        <input
                            type="text"
                            required
                            placeholder="VD: FIG-003"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên mẫu</label>
                        <input
                            type="text"
                            required
                            placeholder="Tên mẫu thiết kế"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            rows={3}
                            placeholder="Mô tả mẫu thiết kế..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File 3D (.stl, .obj)</label>
                        <input
                            type="file"
                            accept=".stl,.obj"
                            onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {mockConceptTags.map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            tags: prev.tags.includes(tag.id)
                                                ? prev.tags.filter((t) => t !== tag.id)
                                                : [...prev.tags, tag.id],
                                        }));
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${formData.tags.includes(tag.id)
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                        >
                            Tạo mẫu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffTemplateManagement;
