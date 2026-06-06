import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Empty, InputNumber, Spin, Tag, Typography } from 'antd';
import technicalDraftApi from '../api/technicalDraftApi';
import Model3DPreview from '../components/Mainflow2/Model3DPreview';

const { Text } = Typography;

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '-';

const MyDesignDetail = () => {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await technicalDraftApi.getDetail(draftId);
        setDraft(res?.data || null);
      } catch {
        setDraft(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [draftId]);

  const displayPrice = useMemo(() => {
    if (!draft) return 0;
    return draft.finalPrice ?? draft.displayPrice ?? draft.price ?? 0;
  }, [draft]);

  const handleBuyNow = () => {
    navigate('/checkout', {
      state: {
        cartItems: [
          {
            technicalDraftId: draft.id,
            name: `[In theo yêu cầu] ${draft.name || draft.designWorkName || 'Thiết kế'}`,
            price: displayPrice,
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
        <Spin size="large" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <Card>
            <Empty description="Không tìm thấy thiết kế" />
          </Card>
        </div>
      </div>
    );
  }

  const previewUrl = draft.previewModelUrl || draft.designVersionFileUrl || draft.baseImageUrl;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <Button onClick={() => navigate('/my-designs')} className="mb-3">Quay lại kho đồ</Button>
            <h1 className="text-2xl font-bold m-0">{draft.name || draft.designWorkName || 'Chi tiết thiết kế'}</h1>
            <Text type="secondary">Thiết kế riêng đã duyệt của bạn</Text>
          </div>
          <Tag color={draft.isConfirmed ? 'green' : 'orange'}>
            {draft.isConfirmed ? 'Đã duyệt' : 'Chưa duyệt'}
          </Tag>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <Card>
            {previewUrl ? (
              <Model3DPreview fileUrl={previewUrl} height={420} />
            ) : (
              <div className="h-[420px] bg-gray-100 rounded flex items-center justify-center text-gray-400">
                Không có preview
              </div>
            )}
          </Card>

          <Card title="Thông tin in">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Vật liệu">
                {draft.materialName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian in ước tính">
                {draft.estimatedPrintTimePerUnit ? `${draft.estimatedPrintTimePerUnit} phút` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Trọng lượng ước tính">
                {draft.estimatedWeightPerUnit ? `${draft.estimatedWeightPerUnit}g` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Độ dày lớp in">
                {draft.layerHeight ? `${draft.layerHeight} mm` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Mật độ in">
                {draft.infillDensity ? `${draft.infillDensity}%` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá vật liệu cơ bản/g">
                {draft.materialBaseCostPerGram != null ? formatPrice(draft.materialBaseCostPerGram) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá dịch vụ vật liệu/g">
                {draft.materialTotalServiceCostPerGram != null ? formatPrice(draft.materialTotalServiceCostPerGram) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày duyệt thiết kế">
                {formatDate(draft.confirmedAt || draft.lastModified)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật giá lần cuối">
                {formatDate(draft.lastPriceUpdatedAt || draft.materialPriceEffectiveDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Giá sản phẩm">
                <span className="text-lg font-bold text-indigo-600">{formatPrice(displayPrice)}</span>
              </Descriptions.Item>
            </Descriptions>

            <div className="flex items-center gap-3 mt-5">
              <span className="font-medium">Số lượng</span>
              <InputNumber min={1} max={999} value={quantity} onChange={(value) => setQuantity(value || 1)} />
            </div>
            <Button
              type="primary"
              size="large"
              block
              className="mt-4"
              disabled={!draft.isConfirmed}
              onClick={handleBuyNow}
            >
              Mua ngay - {formatPrice(displayPrice * quantity)}
            </Button>
            <Text type="secondary" className="block text-xs mt-3">
              Giá có thể được tính lại theo cấu hình vật liệu hiện tại khi checkout.
            </Text>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyDesignDetail;
