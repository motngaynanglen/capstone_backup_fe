import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Tag } from 'antd';

const policies = {
  purchase: {
    title: 'Chính sách mua hàng',
    summary: 'Áp dụng cho đặt mua sản phẩm in 3D có sẵn trong danh mục.',
    tags: ['Sản phẩm có sẵn', 'Pre-Order', 'PayOS', '15 phút thanh toán'],
    sections: [
      {
        title: 'Sản phẩm được phép mua',
        items: [
          'Khách hàng chỉ có thể đặt mua các biến thể sản phẩm đang Published và IsActive.',
          'Sản phẩm Draft hoặc Archived không hiển thị và không thể đặt hàng.',
          'Một số sản phẩm hỗ trợ Pre-Order, cho phép đặt mua ngay cả khi tồn kho hiện tại bằng 0.',
        ],
      },
      {
        title: 'Quy trình đặt hàng',
        items: [
          'Khách hàng chọn sản phẩm, số lượng và xác nhận đặt hàng.',
          'Hệ thống tạo đơn hàng Pending và hóa đơn cần thanh toán.',
          'Khách hàng hoàn tất thanh toán trong vòng 15 phút.',
          'Sau khi thanh toán thành công, đơn chuyển sang Processing để chuẩn bị hàng.',
          'Khi đóng gói xong, đơn chuyển sang Finished và chờ giao hàng.',
          'Sau khi giao thành công và được xác nhận, đơn hàng Completed.',
        ],
      },
      {
        title: 'Thanh toán và hủy đơn',
        items: [
          'Hệ thống hỗ trợ thanh toán trực tuyến qua PayOS.',
          'Mỗi khách hàng chỉ được có một đơn Pending chưa thanh toán tại một thời điểm.',
          'Khách hàng chỉ được hủy đơn khi đơn còn Pending.',
          'Sau khi đơn đã thanh toán và vào Processing, hệ thống không hỗ trợ hủy đơn.',
        ],
      },
      {
        title: 'Hệ thống hỗ trợ',
        items: [
          'Mua nhiều sản phẩm trong một đơn hàng.',
          'Đặt trước sản phẩm có chính sách Pre-Order.',
          'Theo dõi trạng thái đơn hàng theo thời gian thực.',
          'Xem lịch sử đơn hàng đã đặt.',
        ],
      },
      {
        title: 'Hệ thống không hỗ trợ',
        items: [
          'Không hỗ trợ thanh toán khi giao hàng (COD).',
          'Không cho phép tạo đơn mới khi đang có đơn Pending chưa thanh toán.',
          'Không hỗ trợ thay đổi sản phẩm hoặc số lượng sau khi đã đặt hàng.',
          'Không hỗ trợ đặt mua sản phẩm Draft hoặc Archived.',
          'Không hỗ trợ đặt số lượng vượt quá tồn kho, trừ sản phẩm có Pre-Order.',
        ],
      },
    ],
  },
  shipping: {
    title: 'Chính sách vận chuyển',
    summary: 'Áp dụng cho mọi đơn hàng có sản phẩm vật lý, gồm mua hàng có sẵn và in theo yêu cầu.',
    tags: ['GHN', 'Giao thủ công', 'Đổi địa chỉ', 'Theo dõi vận đơn'],
    sections: [
      {
        title: 'Phạm vi vận chuyển',
        items: [
          'Hệ thống hỗ trợ giao hàng đến địa chỉ do khách hàng cung cấp.',
          'Địa chỉ giao hàng cần được đăng ký trong tài khoản trước khi đặt hàng.',
          'Đơn dịch vụ thiết kế thuần túy chưa đặt in sẽ không phát sinh vận chuyển.',
        ],
      },
      {
        title: 'Quy trình vận chuyển',
        items: [
          'Preparing: sản phẩm đang được kiểm tra chất lượng và đóng gói.',
          'ReadyForPickup: kiện hàng đã sẵn sàng, chờ đơn vị vận chuyển lấy hoặc khách đến nhận.',
          'InTransit: đơn hàng đang được vận chuyển đến địa chỉ nhận.',
          'Delivered: khách hàng đã nhận hàng thành công.',
          'Failed: giao thất bại do không liên hệ được, từ chối nhận, hẹn lại hoặc sai địa chỉ.',
          'Returning: hàng đang được chuyển trả về shop sau khi giao thất bại.',
          'Cancelled: lượt giao hàng bị hủy, không đồng nghĩa với hủy đơn hàng.',
        ],
      },
      {
        title: 'Đơn vị vận chuyển',
        items: [
          'Giao Hàng Nhanh (GHN): hệ thống tạo mã vận đơn và tem nhãn; trạng thái có thể được GHN cập nhật tự động.',
          'Giao hàng 3D Print Shop: shop tự điều phối và nhân viên cập nhật trạng thái thủ công.',
          'Phí vận chuyển được tính khi đặt hàng và gộp vào hóa đơn cùng tiền hàng.',
        ],
      },
      {
        title: 'Địa chỉ giao hàng',
        items: [
          'Địa chỉ giao hàng được chụp lại tại thời điểm đặt hàng.',
          'Cập nhật địa chỉ trong tài khoản sau khi đặt không tự thay đổi địa chỉ của đơn cũ.',
          'Mỗi đơn hàng chỉ giao về một địa chỉ duy nhất.',
          'Yêu cầu đổi địa chỉ chỉ được xem xét trước khi đơn chuyển sang InTransit.',
        ],
      },
      {
        title: 'Giao hàng thất bại',
        items: [
          'Khi giao thất bại, hàng có thể chuyển sang Returning.',
          'Khách hàng cần liên hệ hỗ trợ để sắp xếp giao lại hoặc xử lý tiếp theo.',
          'Hệ thống không tự động giao lại khi giao thất bại.',
        ],
      },
    ],
  },
  'custom-design-print': {
    title: 'Chính sách dịch vụ thiết kế & in theo yêu cầu',
    summary: 'Áp dụng cho dịch vụ thiết kế 3D riêng và in theo yêu cầu.',
    tags: ['Custom Design', 'Print on Demand', 'Technical Draft', 'Revision'],
    sections: [
      {
        title: 'Điều kiện sử dụng dịch vụ thiết kế',
        items: [
          'Khách hàng cần có tài khoản đã đăng ký và đăng nhập.',
          'Mỗi khách hàng chỉ được có một đơn Pending chưa thanh toán tại một thời điểm.',
          'Khi đặt dịch vụ thiết kế, khách cần chọn ít nhất một gói thuộc nhóm DESIGN_PACKAGE, trừ trường hợp mua thêm lượt hiệu chỉnh.',
        ],
      },
      {
        title: 'Quy trình thiết kế riêng',
        items: [
          'Khách hàng gửi yêu cầu, mô tả ý tưởng, ảnh tham khảo và ghi chú.',
          'Hệ thống tạo hóa đơn phí dịch vụ cần thanh toán trong 15 phút.',
          'Sau khi thanh toán, công việc chuyển sang Pending rồi InProgress.',
          'Khách hàng và nhân viên trao đổi trực tiếp qua chat/log của dự án.',
          'Nhân viên lập bản nháp kỹ thuật gồm vật liệu, thông số in, trọng lượng, thời gian và giá ước tính.',
          'Nếu đồng ý, khách xác nhận đặt in; công việc thiết kế Completed và bị khóa.',
        ],
      },
      {
        title: 'Lượt hiệu chỉnh',
        items: [
          'Số lượt hiệu chỉnh được xác định bởi các tùy chọn dịch vụ nhóm REVISION.',
          'Mỗi yêu cầu sửa đổi tiêu tốn một lượt hiệu chỉnh.',
          'Khi hết lượt, khách có thể mua thêm lượt hiệu chỉnh bằng đơn chỉ chứa tùy chọn REVISION.',
        ],
      },
      {
        title: 'Dịch vụ in theo yêu cầu',
        items: [
          'Khách hàng cần có TechnicalDraft do nhân viên lập và chưa được xác nhận trước đó.',
          'Vật liệu trong bản nháp phải đang hoạt động và có giá hiện hành.',
          'Khách chọn bản nháp, nhập số lượng và chọn địa chỉ giao hàng.',
          'Giá in được tính lại tại thời điểm đặt dựa trên giá vật liệu hiện hành.',
          'Sau thanh toán, bản nháp được đánh dấu đã xác nhận và không thể chỉnh sửa hoặc xóa.',
        ],
      },
      {
        title: 'Hệ thống không hỗ trợ',
        items: [
          'Không thể đặt in bản nháp thuộc dự án của người khác.',
          'Không thể đặt in nếu vật liệu không còn giá hiện hành hoặc đã bị deactivate.',
          'Không thể hủy đơn sau khi đã thanh toán và vào sản xuất.',
          'Không thể chỉnh sửa bản nháp kỹ thuật sau khi đã xác nhận đặt in.',
          'Không hỗ trợ tạo đơn mới khi đang có đơn Pending chưa thanh toán.',
        ],
      },
    ],
  },
};

const policyLinks = [
  { slug: 'purchase', label: 'Mua hàng' },
  { slug: 'shipping', label: 'Vận chuyển' },
  { slug: 'custom-design-print', label: 'Thiết kế & in theo yêu cầu' },
];

function PolicyBody({ policy }) {
  return (
    <article className="space-y-5">
      {policy.sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
          <ul className="space-y-2 pl-5 list-disc text-gray-700 leading-relaxed">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

export default function Policies() {
  const { slug } = useParams();

  if (!slug) return <Navigate to="/policies/purchase" replace />;

  const policy = policies[slug];
  if (!policy) return <Navigate to="/policies/purchase" replace />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/" className="text-sm font-medium text-indigo-600 no-underline hover:text-indigo-800">
            Quay về trang chủ
          </Link>
        </div>

        <Card className="mb-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="uppercase tracking-wide text-xs font-bold text-indigo-600 mb-2">Chính sách</p>
              <h1 className="text-3xl font-bold text-gray-900 m-0">{policy.title}</h1>
              <p className="mt-3 mb-0 text-gray-600 leading-relaxed">{policy.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {policy.tags.map((tag) => (
                  <Tag color="blue" key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>

            <div className="min-w-[240px] rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500 mb-2">Xem chính sách</p>
              <div className="space-y-1">
                {policyLinks.map((link) => (
                  <Link
                    key={link.slug}
                    to={`/policies/${link.slug}`}
                    className={`block rounded-md px-3 py-2 text-sm no-underline ${
                      link.slug === slug
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-white hover:text-indigo-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <PolicyBody policy={policy} />
        </Card>
      </div>
    </div>
  );
}
