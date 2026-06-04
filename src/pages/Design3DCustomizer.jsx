import React, { useState, Suspense, useRef, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Center, Html, useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ---------------- MOCK DATA ---------------- */

const mockVariants = [
    { id: "VAR001", name: "Áo thun in 3D", code: "SHIRT-001", basePrice: 250000, category: "Thời trang", icon: "👕", modelPath: "/models/tshirt.glb" },
    { id: "VAR002", name: "Chibi Figure", code: "FIG-001", basePrice: 150000, category: "Figure", icon: "🎭", modelPath: "/models/Untitled.glb" },
    { id: "VAR003", name: "Ốp điện thoại", code: "CASE-001", basePrice: 120000, category: "Phụ kiện", icon: "📱", modelPath: "/models/phonecase.glb" },
    { id: "VAR004", name: "Cốc in hình", code: "MUG-001", basePrice: 80000, category: "Gia dụng", icon: "☕", modelPath: "/models/mug.glb" },
    { id: "VAR005", name: "Móc khóa", code: "KEY-001", basePrice: 50000, category: "Phụ kiện", icon: "🔑", modelPath: "/models/keychain.glb" },
];

/* ---------------- GLB MODEL WITH DECAL ---------------- */

const GLBModelWithDecal = ({ modelPath, color, textureUrl, imageSize }) => {
    const groupRef = useRef();
    const { scene } = useGLTF(modelPath);
    const [modelBounds, setModelBounds] = useState({ center: [0, 0, 0], size: [1, 1, 1] });

    // Calculate model bounds để biết kích thước và vị trí
    useEffect(() => {
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        setModelBounds({
            center: [center.x, center.y, center.z],
            size: [size.x, size.y, size.z]
        });
        console.log("Model bounds:", { center: center.toArray(), size: size.toArray() });
    }, [scene]);

    // Clone và apply màu
    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.color = new THREE.Color(color);
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    }, [scene, color]);

    useFrame(() => {
        if (groupRef.current) groupRef.current.rotation.y += 0.002;
    });

    // Tính vị trí decal dựa trên bounds của model
    const decalScale = imageSize === "s" ? 0.3 : imageSize === "l" ? 0.7 : 0.5;
    const decalPosition = [
        modelBounds.center[0],
        modelBounds.center[1] + modelBounds.size[1] * 0.1, // Hơi cao hơn center
        modelBounds.center[2] + modelBounds.size[2] / 2 + 0.01 // Sát mặt trước
    ];

    return (
        <group ref={groupRef}>
            <primitive object={clonedScene} />
            {textureUrl && (
                <DecalPlane
                    url={textureUrl}
                    scale={decalScale * modelBounds.size[0]}
                    position={decalPosition}
                />
            )}
        </group>
    );
};

/* ---------------- DECAL PLANE ---------------- */

const DecalPlane = ({ url, scale, position }) => {
    const texture = useTexture(url);
    texture.colorSpace = THREE.SRGBColorSpace;

    return (
        <mesh position={position}>
            <planeGeometry args={[scale, scale]} />
            <meshBasicMaterial
                map={texture}
                transparent
                side={THREE.FrontSide}
                depthWrite={false}
                depthTest={true}
            />
        </mesh>
    );
};

/* ---------------- FALLBACK MODEL ---------------- */

const FallbackModel = ({ color, textureUrl, imageSize }) => {
    const groupRef = useRef();

    useFrame(() => {
        if (groupRef.current) groupRef.current.rotation.y += 0.003;
    });

    const decalScale = imageSize === "s" ? 0.6 : imageSize === "l" ? 1.2 : 0.9;

    return (
        <group ref={groupRef}>
            {/* Body */}
            <mesh castShadow>
                <boxGeometry args={[2, 2.5, 0.2]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* Sleeves */}
            <mesh castShadow position={[-1.3, 0.6, 0]} rotation={[0, 0, -0.4]}>
                <boxGeometry args={[0.7, 0.5, 0.18]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <mesh castShadow position={[1.3, 0.6, 0]} rotation={[0, 0, 0.4]}>
                <boxGeometry args={[0.7, 0.5, 0.18]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* Collar */}
            <mesh position={[0, 1.25, 0]}>
                <cylinderGeometry args={[0.3, 0.35, 0.12, 32]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* Decal - ngay mặt trước */}
            {textureUrl && (
                <DecalPlane url={textureUrl} scale={decalScale} position={[0, 0.1, 0.11]} />
            )}
            {/* Info */}
            <Html position={[0, -1.6, 0]} center>
                <div className="bg-orange-500/90 text-white px-2 py-1 rounded text-xs">
                    📁 Thêm file .glb vào /public/models/
                </div>
            </Html>
        </group>
    );
};

/* ---------------- MODEL LOADER WITH ERROR HANDLING ---------------- */

const ModelWithErrorBoundary = ({ modelPath, color, textureUrl, imageSize }) => {
    const [error, setError] = useState(false);

    if (error) {
        return <FallbackModel color={color} textureUrl={textureUrl} imageSize={imageSize} />;
    }

    return (
        <React.Suspense fallback={<Html center><div className="text-white">Loading model...</div></Html>}>
            <ErrorCatcher onError={() => setError(true)}>
                <GLBModelWithDecal
                    modelPath={modelPath}
                    color={color}
                    textureUrl={textureUrl}
                    imageSize={imageSize}
                />
            </ErrorCatcher>
        </React.Suspense>
    );
};

class ErrorCatcher extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch() { this.props.onError?.(); }
    render() {
        return this.state.hasError ? null : this.props.children;
    }
}

/* ---------------- MAIN COMPONENT ---------------- */

const Design3DCustomizer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialVariantId = searchParams.get("variant") || mockVariants[0].id;

    const [selectedVariant, setSelectedVariant] = useState(
        mockVariants.find((v) => v.id === initialVariantId) || mockVariants[0]
    );
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageSize, setImageSize] = useState("m");
    const [modelColor, setModelColor] = useState("#ffffff");

    const colors = [
        { id: "white", value: "#ffffff" },
        { id: "cream", value: "#f5f5dc" },
        { id: "black", value: "#222222" },
        { id: "navy", value: "#1e3a5f" },
        { id: "red", value: "#dc2626" },
        { id: "green", value: "#16a34a" },
        { id: "pink", value: "#ec4899" },
        { id: "purple", value: "#7c3aed" },
    ];

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedImage(file);
            const reader = new FileReader();
            reader.onload = (event) => setImagePreview(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
    };

    const handleAddToCart = () => {
        console.log("Adding to cart:", { variant: selectedVariant, image: uploadedImage, imageSize, modelColor });
        alert("Đã thêm vào giỏ hàng!");
        navigate("/cart");
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Top Bar */}
            <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">← Quay lại</button>
                <h1 className="text-white font-semibold">🎨 Thiết kế sản phẩm 3D</h1>
                <button onClick={handleAddToCart} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    🛒 Thêm ({(selectedVariant.basePrice + (uploadedImage ? 30000 : 0)).toLocaleString()}đ)
                </button>
            </div>

            <div className="flex" style={{ height: "calc(100vh - 60px)" }}>
                {/* Left - Variants */}
                <div className="w-20 bg-gray-800 py-4 flex flex-col items-center gap-2 border-r border-gray-700">
                    {mockVariants.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            title={variant.name}
                            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${selectedVariant.id === variant.id ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-700 hover:bg-gray-600"
                                }`}
                        >
                            <span className="text-xl">{variant.icon}</span>
                            <span className="text-[9px] text-gray-300">{variant.code.split("-")[0]}</span>
                        </button>
                    ))}
                </div>

                {/* Center - 3D Canvas */}
                <div className="flex-1 relative bg-gradient-to-b from-gray-800 to-gray-900">
                    <Canvas
                        shadows
                        camera={{ position: [0, 0, 3], fov: 50 }}
                        key={`${selectedVariant.id}-${imagePreview?.slice(-10)}`}
                    >
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
                        <pointLight position={[-5, 5, 5]} intensity={0.5} />

                        <Suspense fallback={<Html center><div className="text-white animate-pulse">Đang tải model...</div></Html>}>
                            <Center>
                                <ModelWithErrorBoundary
                                    modelPath={selectedVariant.modelPath}
                                    color={modelColor}
                                    textureUrl={imagePreview}
                                    imageSize={imageSize}
                                />
                            </Center>
                            <Environment preset="studio" />
                        </Suspense>

                        <OrbitControls
                            enablePan={false}
                            enableZoom
                            enableRotate
                            minDistance={1}
                            maxDistance={8}
                            target={[0, 0, 0]}
                        />
                    </Canvas>

                    {/* Info */}
                    <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur px-4 py-2 rounded-xl">
                        <p className="text-white font-medium">{selectedVariant.icon} {selectedVariant.name}</p>
                        <p className="text-gray-400 text-xs">{selectedVariant.modelPath}</p>
                    </div>

                    {imagePreview && (
                        <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur px-3 py-2 rounded-xl flex items-center gap-2">
                            <span className="text-white text-sm">✓ Hình đã gắn</span>
                            <img src={imagePreview} alt="" className="w-10 h-10 rounded object-cover" />
                        </div>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 px-4 py-2 rounded-full text-gray-400 text-sm">
                        🖱️ Kéo xoay • Scroll zoom
                    </div>
                </div>

                {/* Right - Controls */}
                <div className="w-72 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
                    {/* Upload */}
                    <div className="mb-5">
                        <h3 className="text-white font-medium mb-2 text-sm">① Hình in lên áo</h3>
                        {!imagePreview ? (
                            <label className="block w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <div className="h-full flex flex-col items-center justify-center">
                                    <span className="text-4xl mb-2">📷</span>
                                    <span className="text-gray-400 text-sm">Chọn hình</span>
                                </div>
                            </label>
                        ) : (
                            <div className="relative">
                                <img src={imagePreview} alt="" className="w-full h-32 object-contain rounded-xl bg-gray-700" />
                                <button onClick={handleRemoveImage} className="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full text-lg hover:bg-red-600">×</button>
                            </div>
                        )}
                    </div>

                    {/* Size */}
                    {imagePreview && (
                        <div className="mb-5">
                            <h3 className="text-white font-medium mb-2 text-sm">② Kích thước hình</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[{ id: "s", label: "Nhỏ" }, { id: "m", label: "Vừa" }, { id: "l", label: "Lớn" }].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setImageSize(s.id)}
                                        className={`py-2 rounded-lg font-medium transition-colors ${imageSize === s.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color */}
                    <div className="mb-5">
                        <h3 className="text-white font-medium mb-2 text-sm">{imagePreview ? "③" : "②"} Màu áo</h3>
                        <div className="grid grid-cols-8 gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setModelColor(c.value)}
                                    className={`aspect-square rounded-lg border-2 transition-all ${modelColor === c.value ? "border-blue-400 scale-105" : "border-gray-600"}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30">
                        <div className="flex justify-between text-gray-300 text-sm">
                            <span>{selectedVariant.name}</span>
                            <span>{selectedVariant.basePrice.toLocaleString()}đ</span>
                        </div>
                        {uploadedImage && (
                            <div className="flex justify-between text-gray-300 text-sm mt-1">
                                <span>In hình</span>
                                <span>+30,000đ</span>
                            </div>
                        )}
                        <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between text-white font-bold">
                            <span>Tổng</span>
                            <span className="text-blue-400">{(selectedVariant.basePrice + (uploadedImage ? 30000 : 0)).toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Design3DCustomizer;
