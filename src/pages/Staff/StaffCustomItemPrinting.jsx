import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, message, Tag, Space, Typography, Alert } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getOrderDetailApi, updateOrderItemFulfillmentApi } from '../../api/orderApi';
import { fulfillmentStatusMap, normStatus } from '../../utils/staffOrderConstants';

const { Title, Text } = Typography;

export default function StaffCustomItemPrinting() {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const [item, setItem] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getOrderDetailApi(orderId);
        const data = res?.data || res;
        setOrder(data);
        const found = (data?.items || []).find((i) => String(i.id) === String(itemId));
        setItem(found || null);
        if (!found) message.warning('Không tìm thấy dòng hàng trong đơn');
      } catch {
        message.error('Không tải được thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, itemId]);

  const updateStatus = async (fulfillmentStatus) => {
    setBusy(true);
    try {
      const res = await updateOrderItemFulfillmentApi(itemId, { fulfillmentStatus });
      message.success(res?.data?.message || `Đã cập nhật → ${fulfillmentStatus}`);
      setItem((prev) => (prev ? { ...prev, fulfillmentStatus } : prev));
    } catch (e) {
      message.error(e?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const fs = normStatus(item?.fulfillmentStatus);
  const fsMeta = fulfillmentStatusMap[fs];

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/staff/production-queue?orderId=${orderId}`)}
        style={{ paddingLeft: 0, marginBottom: 16 }}
      >
        Về hàng đợi sản xuất
      </Button>

      <Title level={4}>
        In sản phẩm — {item?.itemName || itemId}
      </Title>
      <Text type="secondary">Đơn: {order?.code || orderId}</Text>

      {!item ? (
        <Alert type="error" message="Không tìm thấy dòng hàng" style={{ marginTop: 16 }} />
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Trạng thái hiện tại: </Text>
              {fsMeta ? (
                <Tag color={fsMeta.color}>{fsMeta.label}</Tag>
              ) : (
                <Tag>{fs || '—'}</Tag>
              )}
            </div>

            <Space wrap>
              {fs !== 'PRINTING' && fs !== 'FINISHED' && (
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  loading={busy}
                  onClick={() => updateStatus('PRINTING')}
                >
                  Bắt đầu in
                </Button>
              )}
              {fs === 'PRINTING' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={busy}
                  onClick={() => updateStatus('FINISHED')}
                >
                  Hoàn thiện in
                </Button>
              )}
              {fs === 'FINISHED' && (
                <Alert type="success" message="Sản phẩm đã hoàn thiện in." showIcon />
              )}
            </Space>

            <Button onClick={() => navigate(`/staff/shop-orders?openOrderId=${orderId}`)}>
              Mở đơn hàng để giao GHN
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
