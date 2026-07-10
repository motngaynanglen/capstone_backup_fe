import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Spin,
  Alert,
  Button,
  Descriptions,
  Typography,
  Space,
  InputNumber,
  Tag,
  Popconfirm,
  message,
  Divider,
} from 'antd';
import { ReloadOutlined, TruckOutlined, LinkOutlined } from '@ant-design/icons';
import { getShipmentByOrderApi, createCarrierShipmentApi } from '../../api/shipmentApi';
import { updateOrderStatusApi } from '../../api/orderApi';
import { shipmentStatusMap, normStatus } from '../../utils/staffOrderConstants';
import GhnLocationPicker from './GhnLocationPicker';

const { Text } = Typography;

function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function hasGhnCodes(addr) {
  const districtId = pick(addr, 'ghnDistrictId', 'GhnDistrictId');
  const wardCode = pick(addr, 'ghnWardCode', 'GhnWardCode');
  return Boolean(districtId > 0 && String(wardCode || '').trim());
}

function apiErrorMessage(e, fallback) {
  const body = e?.response?.data;
  const msg = body?.data || body?.message || body?.Message || e?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

function isMissingShipmentError(e) {
  if (e?.response?.status !== 400) return false;
  const body = e?.response?.data;
  const text = [body?.message, body?.data, e?.message].filter(Boolean).join(' ');
  return /chưa.*vận đơn|chưa được tạo|không tìm thấy/i.test(text);
}

export default function StaffCarrierActions({
  orderId,
  orderStatus,
  orderItems,
  shipmentSummary,
  onUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [weightGrams, setWeightGrams] = useState(500);
  const [ghnLocation, setGhnLocation] = useState({
    provinceId: null,
    provinceName: '',
    districtId: null,
    districtName: '',
    wardCode: '',
    wardName: '',
  });

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getShipmentByOrderApi(orderId);
      const data = res?.data ?? res;
      setPayload(data);
    } catch (e) {
      if (isMissingShipmentError(e)) {
        setPayload(shipmentSummary ? { shipment: shipmentSummary } : null);
        setError(null);
      } else {
        const msg = apiErrorMessage(e, 'Không tải được thông tin vận chuyển.');
        setError(msg);
        setPayload(shipmentSummary ? { shipment: shipmentSummary } : null);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, shipmentSummary]);

  useEffect(() => {
    load();
  }, [load]);

  const shipment = pick(payload, 'shipment', 'Shipment') || payload;
  const shippingAddress = pick(shipment, 'shippingAddress', 'ShippingAddress');
  const addressHasGhn = hasGhnCodes(shippingAddress);
  const ghnPatchReady = ghnLocation.districtId > 0 && Boolean(ghnLocation.wardCode?.trim());
  const summary = shipmentSummary || null;
  const tracking = pick(shipment, 'trackingNumber', 'TrackingNumber', 'trackingNo')
    ?? pick(summary, 'trackingNumber', 'TrackingNumber', 'trackingNo');
  const carrier = pick(shipment, 'carrier', 'Carrier') ?? pick(summary, 'carrier', 'Carrier');
  const status = normStatus(
    pick(shipment, 'shipmentStatus', 'ShipmentStatus', 'status')
      ?? pick(summary, 'shipmentStatus', 'ShipmentStatus', 'status'),
  );
  const carrierOrderCode =
    pick(shipment, 'carrierOrderCode', 'CarrierOrderCode')
    ?? pick(summary, 'carrierOrderCode', 'CarrierOrderCode');
  const labelUrl = pick(shipment, 'carrierLabelUrl', 'CarrierLabelUrl');
  const os = normStatus(orderStatus);
  const canCreateGhn = os === 'FINISHED' && !carrierOrderCode;

  const handleCreateGhn = async () => {
    setCreating(true);
    try {
      const body = {
        carrier: 'GHN',
        weightGrams: weightGrams || 500,
      };
      if (ghnPatchReady) {
        body.ghnDistrictId = ghnLocation.districtId;
        body.ghnWardCode = ghnLocation.wardCode;
      }
      const res = await createCarrierShipmentApi(orderId, body);
      const d = res?.data;
      message.success(
        `Đã tạo vận đơn GHN${d?.carrierOrderCode ? ` — mã ${d.carrierOrderCode}` : ''}`,
      );
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Tạo vận đơn GHN thất bại'));
    } finally {
      setCreating(false);
    }
  };

  const handleShipmentStatus = async (shipmentStatus, orderStatusUpdate) => {
    setCreating(true);
    try {
      await updateOrderStatusApi(orderId, {
        orderStatus: orderStatusUpdate || os,
        shipmentStatus,
      });
      message.success(`Đã cập nhật vận chuyển → ${shipmentStatus}`);
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Cập nhật vận chuyển thất bại');
    } finally {
      setCreating(false);
    }
  };

  const statusTag = shipmentStatusMap[status];

  const ghnCreateBlock = canCreateGhn ? (
    <>
      <Divider style={{ margin: '8px 0' }} />
      {!addressHasGhn && (
        <Alert
          type="info"
          showIcon
          message="Hệ thống sẽ tự map mã GHN từ Phường/Quận/Tỉnh"
          description="Chỉ chọn lại khu vực GHN bên dưới nếu tạo vận đơn báo lỗi không map được."
          style={{ marginBottom: 12 }}
        />
      )}
      {!addressHasGhn && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            Tùy chọn — sửa khu vực GHN thủ công:
          </Text>
          <GhnLocationPicker value={ghnLocation} onChange={setGhnLocation} />
        </div>
      )}
      <Space wrap align="center">
        <Text>Khối lượng (gram):</Text>
        <InputNumber
          min={100}
          max={50000}
          step={100}
          value={weightGrams}
          onChange={(v) => setWeightGrams(v ?? 500)}
        />
        <Popconfirm
          title="Tạo vận đơn GHN?"
          description="Đơn phải ở trạng thái FINISHED. GHN sẽ nhận thông tin giao hàng từ đơn."
          onConfirm={handleCreateGhn}
        >
          <Button type="primary" icon={<TruckOutlined />} loading={creating}>
            Tạo vận đơn GHN
          </Button>
        </Popconfirm>
      </Space>
    </>
  ) : null;

  return (
    <Card
      size="small"
      title={
        <Space>
          <TruckOutlined />
          Vận chuyển GHN
        </Space>
      }
      extra={
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => {
            load();
            onUpdated?.();
          }}
        >
          Làm mới
        </Button>
      }
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}
      {!loading && error && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert type="warning" message={error} showIcon />
          {ghnCreateBlock}
          {os !== 'FINISHED' && !carrierOrderCode && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hoàn tất sản xuất và chuyển đơn sang FINISHED trước khi tạo GHN.
            </Text>
          )}
        </Space>
      )}
      {!loading && !error && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Trạng thái đơn">
              <Tag>{os || '—'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Đơn vị VC">{carrier || '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái VC">
              {statusTag ? (
                <Tag color={statusTag.color}>{statusTag.label}</Tag>
              ) : (
                status || '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Mã vận đơn">{carrierOrderCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="Tracking">{tracking || '—'}</Descriptions.Item>
            <Descriptions.Item label="Số dòng hàng">
              {Array.isArray(orderItems) ? orderItems.length : '—'}
            </Descriptions.Item>
          </Descriptions>

          {!shipment && (
            <Alert type="info" showIcon message="Chưa có bản ghi vận chuyển gắn với đơn này." />
          )}

          {ghnCreateBlock}

          {carrierOrderCode && (
            <Alert
              type="success"
              showIcon
              message={`Đã có vận đơn ${carrier || 'GHN'}: ${carrierOrderCode}`}
              description={
                labelUrl ? (
                  <a href={labelUrl} target="_blank" rel="noreferrer">
                    <LinkOutlined /> Mở nhãn vận đơn
                  </a>
                ) : null
              }
            />
          )}

          {carrierOrderCode && status === 'READY_FOR_PICKUP' && (
            <Button
              loading={creating}
              onClick={() => handleShipmentStatus('IN_TRANSIT', os)}
            >
              Xác nhận đã bàn giao ship → IN_TRANSIT
            </Button>
          )}

          {status === 'IN_TRANSIT' && (
            <Popconfirm
              title="Xác nhận giao thành công?"
              onConfirm={() => handleShipmentStatus('DELIVERED', 'COMPLETED')}
            >
              <Button type="primary" loading={creating}>
                Giao thành công → DELIVERED
              </Button>
            </Popconfirm>
          )}

          {os !== 'FINISHED' && !carrierOrderCode && shipment && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hoàn tất sản xuất và chuyển đơn sang FINISHED trước khi tạo GHN.
            </Text>
          )}
        </Space>
      )}
    </Card>
  );
}
