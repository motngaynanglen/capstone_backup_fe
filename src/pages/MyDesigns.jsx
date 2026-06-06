import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Tag, Button, InputNumber, Typography, Descriptions } from 'antd';
import { useNavigate } from 'react-router-dom';
import technicalDraftApi from '../api/technicalDraftApi';

const { Text } = Typography;
const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const formatDate = (d) =>
  d ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)) : '—';

const MyDesigns = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await technicalDraftApi.getMyConfirmed();
        setDrafts(res?.data || []);
      } catch {
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOrderDraft = (draft) => {
    navigate('/checkout', {
      state: {
        cartItems: [
          {
            technicalDraftId: draft.id,
            name: `[In theo yêu cầu] ${draft.name || draft.designWorkName || 'Thiết kế'}`,
            price: draft.finalPrice || draft.unitPrice || draft.price,
            quantity,
            material: draft.materialName,
            sourceType: 'PRINT_SERVICE',
          },
        ],
        checkoutMode: 'DRAFT',
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spin size="large" tip="Đang tải kho đồ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-2">Kho đồ của tôi</h1>
        <p className="text-gray-500 mb-6">
          Các thiết kế đã được duyệt — sẵn sàng đặt in bất cứ lúc nào
        </p>

        {drafts.length === 0 ? (
          <Card>
            <Empty
              description={
                <div className="space-y-2">
                  <p>Chưa có thiết kế nào trong kho đồ</p>
                  <p className="text-xs text-gray-400">
                    Yêu cầu thiết kế → Nhân viên tạo bản nháp kỹ thuật → Bạn duyệt → Thiết kế vào kho đồ
                  </p>
                  <Button type="primary" onClick={() => navigate('/custom-order/request-design')}>
                    Yêu cầu thiết kế mới
                  </Button>
                </div>
              }
            />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {drafts.map((draft) => (
              <Col xs={24} sm={12} md={8} key={draft.id}>
                <Card
                  hoverable
                  className={`h-full transition-all ${selectedDraft?.id === draft.id ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200' : ''}`}
                  onClick={() => {
                    setSelectedDraft(draft);
                    setQuantity(1);
                  }}
                  cover={
                    draft.baseImageUrl ? (
                      <img
                        alt={draft.designWorkName || 'Thiết kế'}
                        src={draft.baseImageUrl}
                        style={{ height: 160, objectFit: 'cover', background: '#f3f4f6' }}
                      />
                    ) : (
                      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af', fontSize: 40 }}>
                        🖨️
                      </div>
                    )
                  }
                >
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base m-0 line-clamp-2">
                      {draft.name || draft.designWorkName || 'Thiết kế'}
                    </h3>
                    <Tag color="blue">{draft.materialName || 'N/A'}</Tag>
                    <div className="text-xs text-gray-400 space-y-1">
                      {draft.estimatedWeightPerUnit > 0 && (
                        <div>Cân nặng: {draft.estimatedWeightPerUnit}g</div>
                      )}
                      {draft.estimatedPrintTimePerUnit > 0 && (
                        <div>Thời gian in: ~{draft.estimatedPrintTimePerUnit} phút</div>
                      )}
                      <div>Ngày duyệt: {formatDate(draft.confirmedDate || draft.lastModified)}</div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-2">
                      {formatPrice(draft.finalPrice || draft.unitPrice || draft.price)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        className="flex-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/my-designs/${draft.id}`);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                      {(draft.designWorkId || draft.DesignWorkId) && (
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/custom-orders/${draft.designWorkId || draft.DesignWorkId}`);
                          }}
                          title="Xem cuộc trò chuyện thiết kế"
                        >
                          💬
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Chi tiết + nút mua */}
        {selectedDraft && (
          <Card className="mt-6" title={`Chi tiết: ${selectedDraft.name || selectedDraft.designWorkName || 'Thiết kế'}`}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Vật liệu">
                {selectedDraft.materialName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Cân nặng">
                {selectedDraft.estimatedWeightPerUnit || 0}g
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian in">
                ~{selectedDraft.estimatedPrintTimePerUnit || 0} phút
              </Descriptions.Item>
              <Descriptions.Item label="Mật độ in">
                {selectedDraft.infillDensity || 0}%
              </Descriptions.Item>
              <Descriptions.Item label="Độ dày lớp">
                {selectedDraft.layerHeight || 0} mm
              </Descriptions.Item>
              <Descriptions.Item label="Giá sản phẩm">
                <span className="text-lg font-bold text-indigo-600">
                  {formatPrice(selectedDraft.unitPrice || selectedDraft.price)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div className="flex items-center gap-4 mt-6">
              <span className="font-medium">Số lượng:</span>
              <InputNumber min={1} max={999} value={quantity} onChange={(v) => setQuantity(v || 1)} />
              <Button type="primary" size="large" onClick={() => handleOrderDraft(selectedDraft)}>
                Mua ngay — {formatPrice((selectedDraft.unitPrice || selectedDraft.price) * quantity)}
              </Button>
            </div>
            <Text type="secondary" className="text-xs mt-2 block">
              Giá sẽ được tính lại theo giá vật liệu hiện tại tại thời điểm đặt.
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyDesigns;
