import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ---------------- MOCK DATA ---------------- */

const mockTemplate = {
    id: "TPL001",
    code: "FIG-001",
    name: "Chibi Character Base",
    description: "Mẫu nhân vật chibi cơ bản để customize. Phù hợp với nhiều loại material khác nhau.",
    thumbnail: "/thumbnails/chibi-base.png",
    fileUrl: "/models/chibi-base.stl",
    status: "published",
    tags: ["Anime", "Cute", "Character"],
    createdAt: "2026-01-10",
    updatedAt: "2026-01-15",
    createdBy: "Staff001",
    versions: [
        { version: 3, date: "2026-01-15", note: "Cải thiện chi tiết mặt" },
        { version: 2, date: "2026-01-12", note: "Thêm base support" },
        { version: 1, date: "2026-01-10", note: "Phiên bản gốc" },
    ],
    variants: [
        {
            id: "VAR001",
            code: "FIG-001-A",
            name: "Chibi Stand Pose",
            basePrice: 150000,
            estimatedWeight: 45,
            isActive: true,
            isDefault: true,
        },
        {
            id: "VAR002",
            code: "FIG-001-B",
            name: "Chibi Sitting Pose",
            basePrice: 180000,
            estimatedWeight: 52,
            isActive: true,
            isDefault: false,
        },
        {
            id: "VAR003",
            code: "FIG-001-C",
            name: "Chibi Action Pose",
            basePrice: 200000,
            estimatedWeight: 60,
            isActive: false,
            isDefault: false,
        },
    ],
};

/* ---------------- ICONS ---------------- */

const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const UploadIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CopyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

/* ---------------- COMPONENT ---------------- */

const StaffTemplateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(mockTemplate);
    const [activeTab, setActiveTab] = useState("variants");
    const [showAddVariantModal, setShowAddVariantModal] = useState(false);

    const toggleVariantStatus = (variantId) => {
        setTemplate((prev) => ({
            ...prev,
            variants: prev.variants.map((v) =>
                v.id === variantId ? { ...v, isActive: !v.isActive } : v
            ),
        }));
    };

    const cloneVariant = (variant) => {
        const newVariant = {
            ...variant,
            id: "VAR" + Date.now(),
            code: variant.code + "-COPY",
            name: variant.name + " (Copy)",
            isDefault: false,
        };
        setTemplate((prev) => ({
            ...prev,
            variants: [...prev.variants, newVariant],
        }));
    };

    const handlePublish = () => {
        setTemplate((prev) => ({
            ...prev,
            status: prev.status === "published" ? "draft" : "published",
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/staff/templates")}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeftIcon />
                    </button>
                    <div className="flex-1">
                        <p className="text-sm text-gray-500 font-mono">{template.code}</p>
                        <h1 className="text-2xl font-bold text-gray-800">{template.name}</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePublish}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${template.status === "published"
                                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                        >
                            <CheckCircleIcon />
                            {template.status === "published" ? "Unpublish" : "Publish mẫu"}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                            <UploadIcon />
                            Cập nhật file
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left - Preview & Info */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        {/* 3D Preview */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p>3D Preview</p>
                                    <p className="text-sm">{template.fileUrl}</p>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <h3 className="font-semibold text-gray-800">Thông tin mẫu</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Trạng thái</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${template.status === "published"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {template.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ngày tạo</span>
                                    <span className="text-gray-800">{template.createdAt}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cập nhật lần cuối</span>
                                    <span className="text-gray-800">{template.updatedAt}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số biến thể</span>
                                    <span className="text-gray-800">{template.variants.length}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-gray-500 text-sm">Tags</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {template.tags.map((tag) => (
                                        <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-gray-500 text-sm">Mô tả</span>
                                <p className="text-gray-800 mt-1">{template.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Tabs Content */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Tabs */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex border-b border-gray-100">
                                {["variants", "versions"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab
                                                ? "text-blue-600 border-b-2 border-blue-600"
                                                : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab === "variants" ? "Biến thể" : "Lịch sử phiên bản"}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === "variants" && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium text-gray-800">Danh sách biến thể</h4>
                                            <button
                                                onClick={() => setShowAddVariantModal(true)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                + Thêm biến thể
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {template.variants.map((variant) => (
                                                <div
                                                    key={variant.id}
                                                    className={`p-4 rounded-xl border transition-colors ${variant.isActive
                                                            ? "bg-white border-gray-200"
                                                            : "bg-gray-50 border-gray-100 opacity-60"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-mono text-xs text-gray-400">{variant.code}</p>
                                                                {variant.isDefault && (
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                                        Default
                                                                    </span>
                                                                )}
                                                                {!variant.isActive && (
                                                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                                                                        Disabled
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-medium text-gray-800 mt-1">{variant.name}</p>
                                                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                                                <span>Giá: {variant.basePrice.toLocaleString()}đ</span>
                                                                <span>~{variant.estimatedWeight}g</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => navigate(`/staff/templates/${id}/variants/${variant.id}`)}
                                                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                                            >
                                                                Chỉnh sửa
                                                            </button>
                                                            <button
                                                                onClick={() => toggleVariantStatus(variant.id)}
                                                                className={`px-3 py-1 text-sm rounded-lg ${variant.isActive
                                                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                                        : "bg-green-50 text-green-600 hover:bg-green-100"
                                                                    }`}
                                                            >
                                                                {variant.isActive ? "Tắt" : "Bật"}
                                                            </button>
                                                            <button
                                                                onClick={() => cloneVariant(variant)}
                                                                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                            >
                                                                <CopyIcon />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "versions" && (
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-gray-800">Lịch sử cập nhật file</h4>
                                        <div className="space-y-3">
                                            {template.versions.map((version, index) => (
                                                <div
                                                    key={version.version}
                                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                                                        }`}>
                                                        v{version.version}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{version.note}</p>
                                                        <p className="text-sm text-gray-500">{version.date}</p>
                                                    </div>
                                                    {index === 0 && (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Variant Modal */}
                {showAddVariantModal && (
                    <AddVariantModal onClose={() => setShowAddVariantModal(false)} />
                )}
            </div>
        </div>
    );
};

/* ---------------- ADD VARIANT MODAL ---------------- */

const AddVariantModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        basePrice: "",
        estimatedWeight: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Creating variant:", formData);
        alert("Thêm biến thể thành công!");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Thêm biến thể mới</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã biến thể</label>
                        <input
                            type="text"
                            required
                            placeholder="VD: FIG-001-D"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên biến thể</label>
                        <input
                            type="text"
                            required
                            placeholder="Tên biến thể"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản (đ)</label>
                            <input
                                type="number"
                                required
                                placeholder="150000"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Khối lượng (g)</label>
                            <input
                                type="number"
                                required
                                placeholder="45"
                                value={formData.estimatedWeight}
                                onChange={(e) => setFormData({ ...formData, estimatedWeight: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                            Thêm biến thể
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffTemplateDetail;
