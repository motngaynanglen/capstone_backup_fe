import React from 'react';
import { Link } from 'react-router-dom';
import { Collapse } from 'antd';
import InfoPageShell from '../../components/Common/InfoPageShell';

const FAQ_ITEMS = [
  {
    key: '1',
    label: '3D Print Shop cung cấp những dịch vụ gì?',
    children:
      'Chúng tôi cung cấp in 3D theo mẫu có sẵn (sản phẩm in sẵn), đặt in theo yêu cầu từ file STL/OBJ/GLB, thiết kế 3D theo ảnh tham khảo, AI tạo mô hình GLB, và dịch vụ gia công hoàn thiện sau in.',
  },
  {
    key: '2',
    label: 'Tôi cần chuẩn bị file như thế nào để đặt in?',
    children:
      'Hệ thống hỗ trợ các định dạng phổ biến: STL, OBJ, GLB. File nên được kiểm tra kín, không lỗi mesh và có kích thước thực tế (mm). Nếu chưa có file, bạn có thể gửi ảnh tham khảo hoặc dùng tính năng AI tạo mô hình trên trang Đặt in theo yêu cầu.',
  },
  {
    key: '3',
    label: 'Làm sao để biết giá in trước khi đặt hàng?',
    children:
      'Với sản phẩm in sẵn, giá hiển thị trực tiếp trên trang sản phẩm. Với đơn custom, kỹ thuật viên sẽ báo giá qua Mainflow2 sau khi xem file hoặc yêu cầu thiết kế. Bạn duyệt giá và thanh toán trực tuyến trước khi sản xuất.',
  },
  {
    key: '4',
    label: 'Thời gian sản xuất và giao hàng bao lâu?',
    children:
      'Thời gian in phụ thuộc kích thước, vật liệu và số lượng — thường từ 24–72 giờ sau khi xác nhận thanh toán. Giao hàng toàn quốc qua đối tác vận chuyển (GHN), thời gian nhận hàng thêm 1–5 ngày làm việc tùy khu vực.',
  },
  {
    key: '5',
    label: 'Tôi có thể xem trước mô hình 3D trước khi mua không?',
    children: (
      <>
        Có. Trang sản phẩm in sẵn hỗ trợ xem mô hình 3D trực tiếp trên trình duyệt. Với đơn custom,
        bạn có thể xem file GLB sau khi kỹ thuật viên gửi bản thiết kế qua Mainflow2.{' '}
        <Link to="/products" className="text-indigo-600 font-medium no-underline hover:underline">
          Xem sản phẩm in sẵn
        </Link>
      </>
    ),
  },
  {
    key: '6',
    label: 'Chính sách đổi trả và bảo hành như thế nào?',
    children:
      'Sản phẩm in 3D được sản xuất theo yêu cầu nên không áp dụng đổi trả vì thay đổi ý định. Nếu sản phẩm bị lỗi in, gãy do lỗi sản xuất hoặc sai so với mô tả đã duyệt, vui lòng liên hệ trong vòng 7 ngày kể từ khi nhận hàng để được hỗ trợ in lại hoặc hoàn tiền phần lỗi.',
  },
  {
    key: '7',
    label: 'Tôi có thể theo dõi đơn hàng ở đâu?',
    children: (
      <>
        Sau khi đăng nhập, vào{' '}
        <Link to="/my-orders" className="text-indigo-600 font-medium no-underline hover:underline">
          Đơn hàng của tôi
        </Link>{' '}
        hoặc{' '}
        <Link to="/my-custom-orders" className="text-indigo-600 font-medium no-underline hover:underline">
          Đơn hàng Custom
        </Link>{' '}
        để xem trạng thái, mã vận đơn và lịch sử cập nhật.
      </>
    ),
  },
];

const FaqPage = () => (
  <InfoPageShell
    title="Câu hỏi thường gặp"
    subtitle="Giải đáp nhanh về dịch vụ in 3D, đặt hàng, thanh toán và giao hàng tại 3D Print Shop."
  >
    <Collapse
      accordion
      bordered={false}
      items={FAQ_ITEMS}
      className="bg-transparent [&_.ant-collapse-header]:font-medium [&_.ant-collapse-header]:text-slate-800"
    />
    <p className="mt-6 mb-0 text-sm text-slate-500 text-center">
      Không tìm thấy câu trả lời?{' '}
      <Link to="/contact" className="text-indigo-600 font-medium no-underline hover:underline">
        Liên hệ với chúng tôi
      </Link>
    </p>
  </InfoPageShell>
);

export default FaqPage;
