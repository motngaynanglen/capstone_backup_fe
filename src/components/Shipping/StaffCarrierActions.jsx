import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Spin,
  Alert,
  Button,
  Descriptions,
  Typography,
  Space,
  Input,
  DatePicker,
  InputNumber,
  Tag,
  Popconfirm,
  message,
  Divider,
  Segmented,
} from 'antd';
import { CheckCircleOutlined, ReloadOutlined, SendOutlined, TruckOutlined } from '@ant-design/icons';
import {
  getShipmentByOrderApi,
  createShipmentApi,
  createCarrierShipmentApi,
  markShipmentReadyApi,
  markShipmentInTransitApi,
  confirmShipmentDeliveredApi,
  cancelShipmentApi,
  simulateGhnStatusApi,
} from '../../api/shipmentApi';
import { completeOrderApi } from '../../api/orderApi';
import { shipmentStatusMap, normStatus } from '../../utils/staffOrderConstants';
import GhnLocationPicker from './GhnLocationPicker';

const { Text } = Typography;

const ENABLE_GHN_SHIPPING = true;

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

function toWeightGrams(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
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
  const [manualShipment, setManualShipment] = useState({
    carrierName: '',
    trackingNumber: '',
    estimatedDeliveryTime: null,
  });
  const [shippingMode, setShippingMode] = useState('ghn');

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

  const totalEstimatedWeight = useMemo(() => {
    if (!Array.isArray(orderItems)) return 0;
    return orderItems.reduce((sum, item) => {
      const weight = toWeightGrams(
        pick(item, 'estimatedWeightPerUnit', 'EstimatedWeightPerUnit', 'weight', 'Weight'),
      );
      const qty = Number(pick(item, 'quantityOrdered', 'QuantityOrdered', 'quantity', 'Quantity')) || 1;
      return sum + weight * qty;
    }, 0);
  }, [orderItems]);

  useEffect(() => {
    if (totalEstimatedWeight > 0) {
      setWeightGrams(Math.max(100, Math.round(totalEstimatedWeight)));
    }
  }, [totalEstimatedWeight]);

  const shipment = pick(payload, 'shipment', 'Shipment') || payload;
  const shippingAddress = pick(shipment, 'shippingAddress', 'ShippingAddress');
  const addressHasGhn = hasGhnCodes(shippingAddress);
  const ghnPatchReady = ghnLocation.districtId > 0 && Boolean(ghnLocation.wardCode?.trim());
  const summary = shipmentSummary || null;
  const tracking = pick(shipment, 'trackingNumber', 'TrackingNumber', 'trackingNo', 'TrackingNo')
    ?? pick(summary, 'trackingNumber', 'TrackingNumber', 'trackingNo', 'TrackingNo');
  const carrier = pick(shipment, 'carrierName', 'CarrierName', 'carrier', 'Carrier')
    ?? pick(summary, 'carrierName', 'CarrierName', 'carrier', 'Carrier');
  const status = normStatus(
    pick(shipment, 'shipmentStatus', 'ShipmentStatus', 'status')
      ?? pick(summary, 'shipmentStatus', 'ShipmentStatus', 'status'),
  );
  const carrierOrderCode =
    pick(shipment, 'carrierOrderCode', 'CarrierOrderCode')
    ?? pick(summary, 'carrierOrderCode', 'CarrierOrderCode');
  const carrierCode = String(pick(shipment, 'carrier', 'Carrier') ?? pick(summary, 'carrier', 'Carrier') ?? '').toUpperCase();
  const isGhnShipment = carrierCode === 'GHN' || (Boolean(carrierOrderCode) && carrierCode !== 'MANUAL');
  const displayedTrackingCode = carrierOrderCode || tracking;
  const shipmentId = pick(shipment, 'id', 'Id') ?? pick(summary, 'id', 'Id');
  const os = normStatus(orderStatus);
  const allItemsFinished = Array.isArray(orderItems) && orderItems.length > 0
    && orderItems.every((item) => normStatus(pick(item, 'fulfillmentStatus', 'FulfillmentStatus')) === 'FINISHED');
  const isCompleted = os === 'COMPLETED';
  const canCreateGhn = ENABLE_GHN_SHIPPING
    && !isCompleted
    && (os === 'FINISHED' || (os === 'PROCESSING' && allItemsFinished))
    && !carrierOrderCode
    && !tracking
    && !['DELIVERED', 'IN_TRANSIT', 'CANCELLED'].includes(status);

  useEffect(() => {
    setManualShipment((current) => ({
      carrierName: current.carrierName || carrier || '',
      trackingNumber: current.trackingNumber || displayedTrackingCode || '',
      estimatedDeliveryTime: current.estimatedDeliveryTime,
    }));
  }, [carrier, displayedTrackingCode]);

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

  const runShipmentAction = async (action, successMessage) => {
    if (!shipmentId) {
      message.warning('Chưa có vận đơn để thao tác.');
      return;
    }
    setCreating(true);
    try {
      await action(shipmentId);
      message.success(successMessage);
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Cập nhật vận chuyển thất bại'));
    } finally {
      setCreating(false);
    }
  };

  const handleMarkReady = () => runShipmentAction(
    (id) => markShipmentReadyApi(id),
    'Đã xác nhận vận đơn sẵn sàng giao',
  );

  const handleConfirmDelivered = () => runShipmentAction(
    (id) => confirmShipmentDeliveredApi(id),
    'Đã xác nhận giao thành công',
  );

  const handleCompleteOrder = async () => {
    setCreating(true);
    try {
      await completeOrderApi(orderId);
      message.success('Đã hoàn thành đơn hàng');
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Không thể hoàn thành đơn hàng. BE có thể đang chặn theo rule nghiệp vụ.'));
    } finally {
      setCreating(false);
    }
  };

  const handleSimulateGhn = async (ghnStatus) => {
    if (!carrierOrderCode) {
      message.warning('Chưa có mã vận đơn GHN.');
      return;
    }
    setCreating(true);
    try {
      await simulateGhnStatusApi(carrierOrderCode, ghnStatus);
      message.success(`Đã giả lập trạng thái GHN: ${ghnStatus}`);
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Giả lập trạng thái thất bại'));
    } finally {
      setCreating(false);
    }
  };

  const isShipmentProblem = ['FAILED', 'RETURNING', 'RETURNED', 'LOST_OR_DAMAGED'].includes(status);

  const statusTag = shipmentStatusMap[status];

  const canShipAction = canCreateGhn
    || (!isCompleted && shipmentId && !isGhnShipment
        && (status === 'READY_FOR_PICKUP' || status === 'PREPARING')
        && !tracking);

  const handleManualShip = async () => {
    const cName = manualShipment.carrierName.trim();
    const tNumber = manualShipment.trackingNumber.trim();
    const edt = manualShipment.estimatedDeliveryTime;
    if (!cName || !tNumber || !edt) {
      message.warning('Vui lòng nhập đủ đơn vị vận chuyển, mã vận đơn và ngày giao dự kiến.');
      return;
    }
    setCreating(true);
    try {
      let sid = shipmentId;
      if (isGhnShipment && sid) {
        await cancelShipmentApi(sid, { reason: 'Chuyển sang giao thủ công' });
        const res = await createShipmentApi({ orderId });
        sid = res?.data?.id ?? res?.id;
      }
      if (sid) {
        try { await markShipmentReadyApi(sid); } catch {}
        await markShipmentInTransitApi(sid, {
          carrierName: cName,
          trackingNumber: tNumber,
          shippedAt: new Date().toISOString(),
          estimatedDeliveryTime:
            typeof edt.toISOString === 'function' ? edt.toISOString() : new Date(edt).toISOString(),
        });
      }
      message.success('Đã bàn giao cho vận chuyển');
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Bàn giao vận chuyển thất bại'));
    } finally {
      setCreating(false);
    }
  };

  const shipActionBlock = canShipAction ? (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <Segmented
        block
        value={shippingMode}
        onChange={setShippingMode}
        options={[
          { label: '🚚 GHN — Giao Hàng Nhanh', value: 'ghn' },
          { label: '📦 Giao thủ công', value: 'manual' },
        ]}
        style={{ marginBottom: 12 }}
      />

      {shippingMode === 'ghn' && (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {!addressHasGhn && (
            <Alert
              type="info"
              showIcon
              message="Hệ thống sẽ tự map mã GHN từ Phường/Quận/Tỉnh"
              description="Chỉ chọn lại khu vực GHN bên dưới nếu tạo vận đơn báo lỗi không map được."
              style={{ marginBottom: 4 }}
            />
          )}
          {!addressHasGhn && (
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Tùy chọn — sửa khu vực GHN thủ công:
              </Text>
              <GhnLocationPicker value={ghnLocation} onChange={setGhnLocation} />
            </div>
          )}
          {totalEstimatedWeight > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <Text type="secondary" className="text-xs">Tổng cân nặng ước tính từ sản phẩm:</Text>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(totalEstimatedWeight).toLocaleString('vi-VN')}g
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({(totalEstimatedWeight / 1000).toFixed(2)} kg)
                </span>
              </div>
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
          </Space>
          <Popconfirm
            title="Tạo vận đơn GHN?"
            description="GHN sẽ nhận thông tin giao hàng từ đơn."
            onConfirm={handleCreateGhn}
          >
            <Button type="primary" icon={<TruckOutlined />} loading={creating} block>
              Tạo vận đơn GHN
            </Button>
          </Popconfirm>
        </Space>
      )}

      {shippingMode === 'manual' && (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input
            value={manualShipment.carrierName}
            onChange={(e) => setManualShipment((c) => ({ ...c, carrierName: e.target.value }))}
            placeholder="Đơn vị vận chuyển (VD: ViettelPost, J&T, ...)"
            maxLength={120}
          />
          <Input
            value={manualShipment.trackingNumber}
            onChange={(e) => setManualShipment((c) => ({ ...c, trackingNumber: e.target.value }))}
            placeholder="Mã vận đơn"
            maxLength={120}
          />
          <DatePicker
            showTime
            style={{ width: '100%' }}
            value={manualShipment.estimatedDeliveryTime}
            onChange={(v) => setManualShipment((c) => ({ ...c, estimatedDeliveryTime: v }))}
            format="DD/MM/YYYY HH:mm"
            placeholder="Ngày giao tới dự kiến"
            disabledDate={(d) => d && d.valueOf() < Date.now() - 86400000}
          />
          <Popconfirm
            title="Bàn giao vận chuyển thủ công?"
            onConfirm={handleManualShip}
          >
            <Button type="primary" icon={<SendOutlined />} loading={creating} block>
              Bàn giao cho vận chuyển
            </Button>
          </Popconfirm>
        </Space>
      )}
    </>
  ) : null;

  return (
    <Card
      size="small"
      title={
        <Space>
          <TruckOutlined />
          Vận chuyển
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
          {ENABLE_GHN_SHIPPING && shipActionBlock}
          {os !== 'FINISHED' && !shipmentId && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hoàn tất sản xuất trước khi xử lý vận chuyển.
            </Text>
          )}
        </Space>
      )}
      {!loading && !error && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {isCompleted && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
                <CheckCircleOutlined /> Đơn hàng đã hoàn thành
              </Tag>
            </div>
          )}

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Trạng thái đơn">
              <Tag>{os || '—'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái VC">
              {statusTag ? (
                <Tag color={statusTag.color}>{statusTag.label}</Tag>
              ) : (
                status || 'Chưa có'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn vị VC">
              {(() => {
                const c = String(carrier || '').toUpperCase();
                if (c === 'GHN' || isGhnShipment) return <Tag color="orange">GHN</Tag>;
                if (c === 'MANUAL' || c === '') return <Tag>Thủ công</Tag>;
                return <Tag>{carrier}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Mã vận đơn">
              {displayedTrackingCode ? (
                <Text copyable strong style={{ fontFamily: 'monospace' }}>{displayedTrackingCode}</Text>
              ) : '—'}
            </Descriptions.Item>
            {(() => {
              const fee = pick(shipment, 'shippingFee', 'ShippingFee');
              return fee > 0 ? (
                <Descriptions.Item label="Phí vận chuyển">
                  <Text strong style={{ color: '#4f46e5' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee)}
                  </Text>
                </Descriptions.Item>
              ) : null;
            })()}
          </Descriptions>

          {!shipmentId && (
            <Alert type="info" showIcon message="Chưa có vận đơn gắn với đơn này." />
          )}

          {ENABLE_GHN_SHIPPING && shipActionBlock}

          {displayedTrackingCode && (
            <Alert
              type="success"
              showIcon
              message={`Đã có vận đơn ${carrier || 'MANUAL'}: ${displayedTrackingCode}`}
            />
          )}

          {!isCompleted && isGhnShipment && carrierOrderCode && (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {isShipmentProblem && (
                <Alert
                  type="error"
                  showIcon
                  message={`Vấn đề vận chuyển: ${statusTag?.label || status}`}
                  description={
                    status === 'FAILED' ? 'Giao hàng thất bại. Liên hệ GHN hoặc đồng bộ lại trạng thái.'
                    : status === 'RETURNING' ? 'Hàng đang trên đường hoàn về kho.'
                    : status === 'RETURNED' ? 'Hàng đã hoàn về kho thành công.'
                    : status === 'LOST_OR_DAMAGED' ? 'Hàng bị thất lạc hoặc hư hỏng. Liên hệ GHN để khiếu nại.'
                    : 'Vui lòng đồng bộ trạng thái từ GHN.'
                  }
                />
              )}
              {!isShipmentProblem && (
                <Alert
                  type="info"
                  showIcon
                  message="Đơn GHN — trạng thái cập nhật tự động qua GHN."
                  description="Không nhập trạng thái thủ công. Trạng thái được cập nhật tự động qua webhook."
                />
              )}
              <Alert
                type="warning"
                showIcon
                message="GHN Sandbox — Giả lập trạng thái"
                description="Đang dùng GHN dev. Chọn trạng thái bên dưới để giả lập quá trình giao hàng."
                style={{ marginBottom: 4 }}
              />
              <Space wrap>
                {status === 'READY_FOR_PICKUP' && (
                  <Popconfirm title="Giả lập: shipper đã lấy hàng?" onConfirm={() => handleSimulateGhn('delivering')}>
                    <Button loading={creating} style={{ borderColor: '#6366f1', color: '#6366f1' }}>
                      Giả lập → Đang giao
                    </Button>
                  </Popconfirm>
                )}
                {(status === 'READY_FOR_PICKUP' || status === 'IN_TRANSIT') && (
                  <Popconfirm title="Giả lập: giao hàng thành công?" onConfirm={() => handleSimulateGhn('delivered')}>
                    <Button loading={creating} type="primary" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                      Giả lập → Giao thành công
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Space>
          )}

          {!isCompleted && shipmentId && status === 'PREPARING' && allItemsFinished && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={creating}
              onClick={handleMarkReady}
            >
              Xác nhận sẵn sàng giao
            </Button>
          )}


          {!isCompleted && status === 'IN_TRANSIT' && !isGhnShipment && (
            <Popconfirm
              title="Xác nhận giao thành công?"
              onConfirm={handleConfirmDelivered}
            >
              <Button type="primary" icon={<TruckOutlined />} loading={creating}>
                Xác nhận giao thành công
              </Button>
            </Popconfirm>
          )}

          {!isCompleted && shipmentId && status === 'DELIVERED' && (
            <Popconfirm
              title="Hoàn thành đơn hàng?"
              onConfirm={handleCompleteOrder}
            >
              <Button type="primary" icon={<CheckCircleOutlined />} loading={creating}>
                Hoàn thành đơn hàng
              </Button>
            </Popconfirm>
          )}

          {os !== 'FINISHED' && !shipmentId && shipment && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hoàn tất sản xuất trước khi xử lý vận chuyển.
            </Text>
          )}
        </Space>
      )}
    </Card>
  );
}
