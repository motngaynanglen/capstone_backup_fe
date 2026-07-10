import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
    CubeIcon,
    ClockIcon,
    ScaleIcon,
    BeakerIcon,
    DocumentTextIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";

// Mock data simulating OrderItem fetch
const mockOrderItem = {
    id: "ITEM-003",
    orderId: "ORD001",
    sourceType: "PREMADE",
    designVariant: {
        code: "KEY-001",
        name: "Móc khóa logo",
        previewModelUrl: "/models/keychain.glb",
    },
    quantityOrdered: 2,
    customer: {
        name: "Nguyễn Văn A"
    }
};

// Mock materials
const mockMaterials = [
    { id: "MAT-001", name: "PLA Red", density: 1.24, costPerGram: 500 },
    { id: "MAT-002", name: "PLA Blue", density: 1.24, costPerGram: 500 },
    { id: "MAT-003", name: "PETG Clear", density: 1.27, costPerGram: 700 },
    { id: "MAT-004", name: "ABS Black", density: 1.04, costPerGram: 450 },
];

const StaffCreateProductionJob = () => {
    const [searchParams] = useSearchParams();
    const itemId = searchParams.get("itemId");
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        // ProductionJob fields
        materialId: "",
        actualScale: 1.0,
        quantityToPrint: mockOrderItem.quantityOrdered,
        slicingFileUrl: "", // In real app, this would be file upload

        // PrintSpec fields
        infillDensity: 20, // %
        layerHeight: 0.2, // mm
        estimatedWeight: 0, // grams
        estimatedPrintTime: 0, // minutes
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Simulate fetch item
        if (itemId !== mockOrderItem.id) {
            // Handle loading different item logic here
        }
    }, [itemId]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const calculateCost = () => {
        const material = mockMaterials.find(m => m.id === formData.materialId);
        if (!material) return 0;
        return formData.estimatedWeight * material.costPerGram;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            console.log("Creating Production Job:", {
                orderItemId: itemId,
                ...formData,
                status: "QUEUED"
            });
            setLoading(false);
            alert("✅ Production Job created successfully!");
            navigate(`/staff/custom-orders-management/${mockOrderItem.orderId}`);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <Link
                    to={`/staff/custom-orders-management/${mockOrderItem.orderId}`}
                    className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Order
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create Production Job</h1>
                <p className="text-gray-500">Configure print settings for Order Item: <span className="font-mono text-gray-700">{itemId}</span></p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Order Item Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Details</h3>

                        <div className="space-y-4">
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <CubeIcon className="w-16 h-16 text-gray-400" />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Product</label>
                                <p className="font-medium text-gray-900">{mockOrderItem.designVariant.name}</p>
                                <p className="text-sm text-gray-500 font-mono">{mockOrderItem.designVariant.code}</p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Order Qty</label>
                                <p className="font-medium text-gray-900">{mockOrderItem.quantityOrdered} pcs</p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Customer</label>
                                <p className="font-medium text-gray-900">{mockOrderItem.customer.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="text-blue-800 font-medium mb-2 flex items-center">
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                            Guide
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                            <li>Slice the model first using Cura/PrusaSlicer.</li>
                            <li>Export G-code file.</li>
                            <li>Input actual weight & time from slicer software.</li>
                        </ul>
                    </div>
                </div>

                {/* Right Column - Job Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">Job Configuration</h3>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Section 1: Core Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Material Material <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="materialId"
                                        value={formData.materialId}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Select Material...</option>
                                        {mockMaterials.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.density} g/cm³)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity to Print <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantityToPrint"
                                        value={formData.quantityToPrint}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Split large orders into multiple jobs if needed.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Actual Scale (multiplier)
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <ScaleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            type="number"
                                            name="actualScale"
                                            step="0.01"
                                            value={formData.actualScale}
                                            onChange={handleChange}
                                            className="block w-full rounded-lg border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        G-code URL / Path
                                    </label>
                                    <input
                                        type="text"
                                        name="slicingFileUrl"
                                        value={formData.slicingFileUrl}
                                        onChange={handleChange}
                                        placeholder="/files/gcode/..."
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Section 2: Print Specifications (from Slicer) */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Slicer Data (PrintSpec)</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estimated Weight (g) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <BeakerIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                name="estimatedWeight"
                                                value={formData.estimatedWeight}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.1"
                                                required
                                                className="block w-full rounded-lg border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-gray-500 sm:text-sm">g</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estimated Time (min) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <ClockIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                name="estimatedPrintTime"
                                                value={formData.estimatedPrintTime}
                                                onChange={handleChange}
                                                min="0"
                                                required
                                                className="block w-full rounded-lg border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-gray-500 sm:text-sm">min</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Layer Height (mm)
                                        </label>
                                        <input
                                            type="number"
                                            name="layerHeight"
                                            value={formData.layerHeight}
                                            onChange={handleChange}
                                            step="0.01"
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Infill Density (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="infillDensity"
                                            value={formData.infillDensity}
                                            onChange={handleChange}
                                            min="0"
                                            max="100"
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Estimated Cost Preview */}
                            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center border border-gray-200">
                                <span className="text-gray-600 font-medium">Estimated Material Cost:</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {calculateCost().toLocaleString()}đ
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                            >
                                {loading ? "Creating Job..." : "Create Production Job"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StaffCreateProductionJob;
