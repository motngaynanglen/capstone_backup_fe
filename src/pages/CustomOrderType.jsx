import React from 'react';
import { Link } from 'react-router-dom';
import img1 from '../components/imgs/1.png';
import img2 from '../components/imgs/2.png';

const CARD_CLASS =
  'flex flex-col h-full min-h-[320px] bg-white rounded-xl shadow-lg overflow-hidden text-center hover:shadow-xl transition-shadow group border border-gray-100';

const MEDIA_CLASS = 'h-40 shrink-0 overflow-hidden bg-gray-50';

const BODY_CLASS = 'flex flex-col flex-1 items-center p-6';

const CustomOrderType = () => {
  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">Đặt in theo yêu cầu</h1>
      <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl mx-auto">
        Chọn cách bạn muốn bắt đầu — kỹ thuật viên tư vấn vật liệu và báo giá
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 items-stretch">
        <Link to="/custom-order/upload" className={CARD_CLASS}>
          <div className={MEDIA_CLASS}>
            <img
              src={img1}
              alt="Upload File"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className={BODY_CLASS}>
            <div className="text-5xl mb-4">📁</div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Đăng tải file 3D</h2>
            <p className="text-gray-600 text-sm leading-relaxed mt-auto">
              Tải STL/OBJ/GLB + mô tả nhu cầu in. Không cần chọn vật liệu.
            </p>
          </div>
        </Link>

        <Link to="/custom-order/ready-print" className={`${CARD_CLASS} border-teal-200 ring-1 ring-teal-100`}>
          <div className={`${MEDIA_CLASS} bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center`}>
            <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🖨️</span>
          </div>
          <div className={BODY_CLASS}>
            <h2 className="text-xl font-bold mb-2 text-gray-800">In từ thiết kế / in lại</h2>
            <p className="text-gray-600 text-sm leading-relaxed mt-auto">
              Thiết kế hoặc đơn in đã xong — đặt hàng và thanh toán ngay (Pre-Order).
            </p>
          </div>
        </Link>

        <Link to="/custom-order/request-design" className={CARD_CLASS}>
          <div className={MEDIA_CLASS}>
            <img
              src={img2}
              alt="Request Design"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className={BODY_CLASS}>
            <div className="text-5xl mb-4">✏️</div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Yêu cầu thiết kế</h2>
            <p className="text-gray-600 text-sm leading-relaxed mt-auto">
              Gửi ảnh tham khảo — đội ngũ thiết kế file 3D cho bạn.
            </p>
          </div>
        </Link>

        <Link to="/custom-order/ai-generate" className={CARD_CLASS}>
          <div className={MEDIA_CLASS}>
            <img
              src={img1}
              alt="AI Generate"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className={BODY_CLASS}>
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">AI tạo mẫu</h2>
            <p className="text-gray-600 text-sm leading-relaxed mt-auto">
              Ảnh → AI tạo GLB → KTV báo giá in → thanh toán toàn bộ → sản xuất.
            </p>
          </div>
        </Link>
      </div>

      <p className="text-center text-sm text-gray-500">
        Quy trình: Upload/AI/Yêu cầu thiết kế → NV báo giá → (cọc + thiết kế với file/upload) hoặc thanh toán full (AI / in sẵn) → Sản xuất & giao
      </p>
    </div>
  );
};

export default CustomOrderType;
