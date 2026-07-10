import React from 'react';
import { Link } from 'react-router-dom';
import InfoPageShell from '../../components/Common/InfoPageShell';

const Section = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-semibold text-slate-900 m-0">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

const ShippingPolicyPage = () => (
  <InfoPageShell
    title="Chính sách vận chuyển"
    subtitle="Thông tin về phạm vi giao hàng, thời gian xử lý, phí ship và quy trình theo dõi đơn hàng."
    wide
  >
    <div className="space-y-8">
      <Section title="1. Phạm vi giao hàng">
        <p className="m-0">
          3D Print Shop giao hàng toàn quốc thông qua đối tác vận chuyển GHN. Hiện tại chúng tôi
          chưa hỗ trợ giao hàng quốc tế.
        </p>
      </Section>

      <Section title="2. Thời gian xử lý đơn hàng">
        <ul className="list-disc pl-5 m-0 space-y-1">
          <li>
            <strong>Sản phẩm in sẵn:</strong> 1–3 ngày làm việc sau khi xác nhận thanh toán (tùy tồn
            kho và số lượng).
          </li>
          <li>
            <strong>Đơn in theo yêu cầu:</strong> 24–72 giờ sản xuất sau khi bạn duyệt báo giá và
            thanh toán. Thời gian có thể dài hơn với mẫu phức tạp hoặc số lượng lớn.
          </li>
          <li>
            Đơn hàng đặt cuối tuần hoặc ngày lễ có thể được xử lý vào ngày làm việc kế tiếp.
          </li>
        </ul>
      </Section>

      <Section title="3. Phí vận chuyển">
        <p className="m-0">
          Phí ship được tính tự động tại bước thanh toán dựa trên địa chỉ nhận hàng, khối lượng và
          kích thước gói hàng. Một số chương trình ưu đãi có thể miễn phí vận chuyển cho đơn đạt
          ngưỡng nhất định (nếu được kích hoạt trên hệ thống).
        </p>
      </Section>

      <Section title="4. Thời gian giao hàng dự kiến">
        <ul className="list-disc pl-5 m-0 space-y-1">
          <li>Nội thành Hà Nội, TP.HCM: 1–2 ngày làm việc sau khi bàn giao cho đơn vị vận chuyển.</li>
          <li>Các tỉnh thành khác: 2–5 ngày làm việc.</li>
          <li>Vùng xa, hải đảo: có thể thêm 1–3 ngày tùy tuyến.</li>
        </ul>
        <p className="m-0 mt-2 text-slate-500">
          Thời gian trên mang tính tham khảo và có thể thay đổi do thời tiết, cao điểm hoặc sự cố
          từ đối tác vận chuyển.
        </p>
      </Section>

      <Section title="5. Đóng gói">
        <p className="m-0">
          Sản phẩm in 3D được bọc bảo vệ bằng vật liệu chống sốc, đặt trong hộp carton cứng. Các mẫu
          nhỏ hoặc dễ vỡ có thể được đặt thêm trong túi zip hoặc hộp riêng trước khi đóng gói cuối.
        </p>
      </Section>

      <Section title="6. Theo dõi vận đơn">
        <p className="m-0">
          Khi đơn hàng sẵn sàng giao, mã vận đơn sẽ được cập nhật trên trang chi tiết đơn hàng của
          bạn. Bạn có thể tra cứu trực tiếp trên website GHN bằng mã vận đơn.
        </p>
      </Section>

      <Section title="7. Kiểm tra khi nhận hàng">
        <ul className="list-disc pl-5 m-0 space-y-1">
          <li>Vui lòng quay video hoặc chụp ảnh khi mở hộp nếu phát hiện hộp bị móp, ướt hoặc rách.</li>
          <li>Báo ngay cho shop trong vòng 24 giờ nếu thiếu sản phẩm hoặc hư hỏng do vận chuyển.</li>
          <li>Khiếu nại sau thời hạn trên có thể không được xử lý nếu thiếu bằng chứng.</li>
        </ul>
      </Section>

      <Section title="8. Giao hàng không thành công">
        <p className="m-0">
          Nếu shipper không liên hệ được sau nhiều lần, đơn có thể bị hoàn về kho. Phí ship hoàn
          hoặc giao lại sẽ do khách hàng chi trả tùy trường hợp. Vui lòng cung cấp số điện thoại
          chính xác và địa chỉ rõ ràng khi đặt hàng.
        </p>
      </Section>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
        <p className="m-0">
          Cần hỗ trợ thêm về vận chuyển? Xem thêm{' '}
          <Link to="/faq" className="text-indigo-600 font-medium no-underline hover:underline">
            Câu hỏi thường gặp
          </Link>{' '}
          hoặc{' '}
          <Link to="/contact" className="text-indigo-600 font-medium no-underline hover:underline">
            Liên hệ
          </Link>
          .
        </p>
      </div>
    </div>
  </InfoPageShell>
);

export default ShippingPolicyPage;
