import React, { useRef, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Breadcrumb } from 'antd';

const Preview3D = () => {
  const { id } = useParams();
  const location = useLocation();
  const mountRef = useRef(null);
  
  // Get breadcrumb data from navigation state, fallback to default
  const rawBreadcrumb = location.state?.breadcrumb || [
    { title: 'Trang chủ', path: '/' },
    { title: 'Đơn hàng của tôi', path: '/my-custom-orders' },
    { title: 'Xem mô hình 3D', path: null }
  ];

  const breadcrumbItems = rawBreadcrumb.map((item) => ({
    title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title
  }));

  useEffect(() => {
    // ... (ThreeJS setup code - giữ nguyên phần tạo scene) ...
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Add a simple geometry for demo
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x667eea });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Controls (simple rotation)
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      cube.rotation.y += 0.01;
      cube.rotation.x += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      if (mountRef.current && renderer.domElement) {
        // Check if renderer.domElement is still a child of mountRef.current
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      // Dispose geometry and material
      geometry.dispose();
      material.dispose();
    };
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">3D Preview</h1>
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div
          ref={mountRef}
          className="w-full h-[600px] rounded-lg"
          style={{ minHeight: '600px' }}
        />
        <div className="mt-4 text-center text-gray-600">
          <p>Use mouse to rotate the view</p>
          <p className="text-sm mt-2">Note: This is a demo preview. In production, load actual STL/OBJ files here.</p>
        </div>
      </div>
    </div>
  );
};

export default Preview3D;

