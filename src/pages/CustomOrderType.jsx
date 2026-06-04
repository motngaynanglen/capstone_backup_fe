import React from 'react';
import { Link } from 'react-router-dom';
import img1 from '../components/imgs/1.png';
import img2 from '../components/imgs/2.png';

const CustomOrderType = () => {
  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">Tạo Đơn Hàng Custom</h1>
      <p className="text-xl text-gray-600 mb-12 text-center">Chọn loại đơn hàng custom bạn muốn tạo</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link
          to="/custom-order/upload"
          className="bg-white rounded-lg shadow-lg overflow-hidden text-center hover:shadow-xl transition-shadow group"
        >
          <div className="h-48 overflow-hidden">
            <img 
              src={img1} 
              alt="Upload File" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="p-8">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📁</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Đăng tải File</h2>
            <p className="text-gray-600 leading-relaxed">
              Tải lên file thiết kế 3D có sẵn (STL/OBJ) và chọn vật liệu, số lượng, loại dịch vụ
            </p>
          </div>
        </Link>

        <Link
          to="/custom-order/request-design"
          className="bg-white rounded-lg shadow-lg overflow-hidden text-center hover:shadow-xl transition-shadow group"
        >
          <div className="h-48 overflow-hidden">
            <img 
              src={img2} 
              alt="Request Design" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="p-8">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">✏️</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Yêu cầu Thiết kế</h2>
            <p className="text-gray-600 leading-relaxed">
              Gửi hình ảnh tham khảo và mô tả ý tưởng để đội ngũ của chúng tôi thiết kế file 3D cho bạn
            </p>
          </div>
        </Link>

        <Link
          to="/custom-order/ai-generate"
          className="bg-white rounded-lg shadow-lg overflow-hidden text-center hover:shadow-xl transition-shadow group"
        >
          <div className="h-48 overflow-hidden">
            <img 
              src={img1} 
              alt="AI Generate" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="p-8">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🤖</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">AI Tạo mẫu</h2>
            <p className="text-gray-600 leading-relaxed">
              Upload 1 ảnh → AI tạo GLB → KTV báo giá in → duyệt & thanh toán → in 3D & giao hàng
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CustomOrderType;

