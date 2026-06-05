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
} from 'antd';
import { CheckCircleOutlined, LinkOutlined, ReloadOutlined, SendOutlined, TruckOutlined } from '@ant-design/icons';
import {
  getShipmentByOrderApi,
  createCarrierShipmentApi,
  markShipmentReadyApi,
  markShipmentInTransitApi,
  confirmShipmentDeliveredApi,
  getShipmentLabelApi,
  syncCarrierShipmentApi,
  cancelShipmentApi,
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
  const labelUrl = pick(shipment, 'carrierLabelUrl', 'CarrierLabelUrl');
  const shipmentId = pick(shipment, 'id', 'Id') ?? pick(summary, 'id', 'Id');
  const os = normStatus(orderStatus);
  const allItemsFinished = Array.isArray(orderItems) && orderItems.length > 0
    && orderItems.every((item) => normStatus(pick(item, 'fulfillmentStatus', 'FulfillmentStatus')) === 'FINISHED');
  const canCreateGhn = ENABLE_GHN_SHIPPING
    && (os === 'FINISHED' || (os === 'PROCESSING' && allItemsFinished))
    && !carrierOrderCode;
  const isCompleted = os === 'COMPLETED';

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

  const handleMarkInTransit = () => {
    const carrierName = manualShipment.carrierName.trim();
    const trackingNumber = manualShipment.trackingNumber.trim();
    const estimatedDeliveryTime = manualShipment.estimatedDeliveryTime;

    if (!carrierName || !trackingNumber || !estimatedDeliveryTime) {
      message.warning('Vui lòng nhập đủ mã vận đơn, đơn vị vận chuyển và ngày giao dự kiến.');
      return;
    }

    return runShipmentAction(
      (id) => markShipmentInTransitApi(id, {
        carrierName,
        trackingNumber,
        shippedAt: new Date().toISOString(),
        estimatedDeliveryTime:
          typeof estimatedDeliveryTime.toISOString === 'function'
            ? estimatedDeliveryTime.toISOString()
            : new Date(estimatedDeliveryTime).toISOString(),
      }),
      'Đã bàn giao cho vận chuyển',
    );
  };

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

  const handleSyncGhn = async () => {
    if (!shipmentId) {
      message.warning('Chưa có vận đơn để đồng bộ.');
      return;
    }
    setCreating(true);
    try {
      await syncCarrierShipmentApi(shipmentId);
      message.success('Đã đồng bộ trạng thái từ GHN');
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Không đồng bộ được trạng thái GHN'));
    } finally {
      setCreating(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!shipmentId) return;
    if (labelUrl) {
      window.open(labelUrl, '_blank', 'noopener');
      return;
    }
    setCreating(true);
    try {
      const res = await getShipmentLabelApi(shipmentId);
      const url = res?.data?.labelUrl || res?.data?.LabelUrl;
      if (url) {
        window.open(url, '_blank', 'noopener');
      } else {
        message.warning('Chưa lấy được phiếu in từ GHN.');
      }
      await load();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Không lấy được phiếu in vận đơn'));
    } finally {
      setCreating(false);
    }
  };

  const handleCancelShipment = async () => {
    if (!shipmentId) return;
    setCreating(true);
    try {
      await cancelShipmentApi(shipmentId, { reason: 'Staff hủy vận đơn' });
      message.success('Đã hủy vận đơn');
      await load();
      onUpdated?.();
    } catch (e) {
      message.error(apiErrorMessage(e, 'Không thể hủy vận đơn. GHN có thể từ chối hủy ở trạng thái hiện tại.'));
    } finally {
      setCreating(false);
    }
  };

  const isShipmentProblem = ['FAILED', 'RETURNING', 'RETURNED', 'LOST_OR_DAMAGED'].includes(status);
  const canCancelGhn = isGhnShipment && carrierOrderCode
    && !['DELIVERED', 'CANCELLED', 'RETURNED', 'LOST_OR_DAMAGED'].includes(status);

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
      {totalEstimatedWeight > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
          <Text type="secondary" className="text-xs">Tổng cân nặng ước tính từ sản phẩm:</Text>
          <div className="text-lg font-bold text-blue-600">
            {Math.round(totalEstimatedWeight).toLocaleString('vi-VN')}g
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({(totalEstimatedWeight / 1000).toFixed(2)} kg)
            </span>
          </div>
        </div>
      )}
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
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
        <Space wrap align="center">
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
      </Space>
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
          {ENABLE_GHN_SHIPPING && ghnCreateBlock}
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

          {ENABLE_GHN_SHIPPING && ghnCreateBlock}

          {displayedTrackingCode && (
            <Alert
              type="success"
              showIcon
              message={`Đã có vận đơn ${carrier || 'MANUAL'}: ${displayedTrackingCode}`}
              description={
                labelUrl ? (
                  <a href={labelUrl} target="_blank" rel="noreferrer">
                    <LinkOutlined /> Mở nhãn vận đơn
                  </a>
                ) : null
              }
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
                  description="Không nhập trạng thái thủ công. Dùng nút bên dưới để đồng bộ hoặc in vận đơn."
                />
              )}
              <Space wrap>
                <Button icon={<ReloadOutlined />} loading={creating} onClick={handleSyncGhn}>
                  Đồng bộ trạng thái GHN
                </Button>
                <Button icon={<LinkOutlined />} loading={creating} onClick={handlePrintLabel}>
                  In vận đơn
                </Button>
                {canCancelGhn && (
                  <Popconfirm
                    title="Hủy vận đơn GHN?"
                    description="GHN sẽ hủy đơn vận chuyển. Hành động không thể hoàn tác nếu shipper đã lấy hàng."
                    okText="Hủy vận đơn"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleCancelShipment}
                  >
                    <Button danger loading={creating}>
                      Hủy vận đơn
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

          {!isCompleted && shipmentId && status === 'READY_FOR_PICKUP' && !isGhnShipment && (
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="Nhập thông tin vận chuyển thủ công trước khi bàn giao đơn."
              />
              <Input
                value={manualShipment.carrierName}
                onChange={(event) => setManualShipment((current) => ({
                  ...current,
                  carrierName: event.target.value,
                }))}
                placeholder="Đơn vị vận chuyển"
                maxLength={120}
              />
              <Input
                value={manualShipment.trackingNumber}
                onChange={(event) => setManualShipment((current) => ({
                  ...current,
                  trackingNumber: event.target.value,
                }))}
                placeholder="Mã vận đơn"
                maxLength={120}
              />
              <DatePicker
                showTime
                style={{ width: '100%' }}
                value={manualShipment.estimatedDeliveryTime}
                onChange={(value) => setManualShipment((current) => ({
                  ...current,
                  estimatedDeliveryTime: value,
                }))}
                format="DD/MM/YYYY HH:mm"
                placeholder="Ngày giao tới dự kiến"
                disabledDate={(current) =>
                  current && current.valueOf() < Date.now() - 24 * 60 * 60 * 1000
                }
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={creating}
                onClick={handleMarkInTransit}
              >
                Đã bàn giao cho vận chuyển
              </Button>
            </Space>
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
