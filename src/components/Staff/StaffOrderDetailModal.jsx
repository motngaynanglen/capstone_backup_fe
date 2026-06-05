import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Space,
  Button,
  Steps,
  Alert,
  Typography,
  Spin,
  message,
  Popconfirm,
  Input,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  TruckOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { getOrderDetailApi, updateOrderItemFulfillmentApi } from '../../api/orderApi';
import { normalizeOrderDetail } from '../../utils/orderNormalize';
import { formatVnd, formatDateTime, shortId } from '../../utils/formatters';
import {
  orderStatusMap,
  shipmentStatusMap,
  fulfillmentStatusMap,
  isCustomManufacturing,
  allOrderItemsReadyForShip,
  normStatus,
} from '../../utils/staffOrderConstants';
import StaffCarrierActions from '../Shipping/StaffCarrierActions';
import { CARRIER_LABELS } from '../../api/shipmentApi';

const { Text, Title } = Typography;

function renderOrderStatus(status) {
  const s = orderStatusMap[normStatus(status)];
  return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
}

function renderShipmentStatus(status) {
  const s = shipmentStatusMap[normStatus(status)];
  return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
}

function renderFulfillment(status) {
  const s = fulfillmentStatusMap[normStatus(status)];
  return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
}

export default function StaffOrderDetailModal({ open, orderId, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await getOrderDetailApi(orderId);
      setOrder(normalizeOrderDetail(res?.data || res));
    } catch (e) {
      message.error(e?.response?.data?.message || 'Không tải được chi tiết đơn');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) load();
    if (!open) {
      setOrder(null);
      setNote('');
    }
  }, [open, orderId, load]);

  const refresh = async () => {
    await load();
    onUpdated?.();
  };

  const handleFulfillment = async (orderItemId) => {
    setBusyItemId(orderItemId);
    try {
      const res = await updateOrderItemFulfillmentApi(orderItemId);
      const data = res?.data;
      message.success(data?.message || 'Đã hoàn tất / đóng gói dòng hàng');
      if (data?.allProductionLinesFinished) {
        message.info('Tất cả dòng đã hoàn thiện — đơn sẵn sàng chuyển sang vận chuyển.');
      }
      setNote('');
      await refresh();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Cập nhật tiến độ thất bại');
    } finally {
      setBusyItemId(null);
    }
  };

  const os = normStatus(order?.orderStatus);
  const paid = normStatus(order?.invoice?.paymentStatus) === 'PAID';
  const isCod = Boolean(order?.invoice?.isCod);
  const canFulfill = paid || isCod;
  const productionItems = (order?.items || []).filter((it) =>
    isCustomManufacturing(it.sourceType),
  );
  const allProductionFinished =
    productionItems.length === 0 ||
    productionItems.every((it) => normStatus(it.fulfillmentStatus) === 'FINISHED');
  const allItemsReady = allOrderItemsReadyForShip(order?.items || []);
  const readyForShip = os === 'PROCESSING' && canFulfill && allItemsReady;
  const hasCarrier = Boolean(
    order?.shipment?.id
      || order?.shipment?.carrierOrderCode
      || order?.shipment?.trackingNumber,
  );
  const shipmentStatus = normStatus(order?.shipment?.shipmentStatus);
  const displayItems = useMemo(() => {
    const items = order?.items || [];
    return items.map((item) => ({
      ...item,
      displayFulfillmentStatus:
        os === 'CANCELLED'
          ? 'CANCELLED'
          : (item.fulfillmentStatus || 'PENDING'),
    }));
  }, [order?.items, os]);

  const isShipmentProblem = ['FAILED', 'RETURNING', 'RETURNED', 'LOST_OR_DAMAGED', 'CANCELLED'].includes(shipmentStatus);

  const workflowStep = (() => {
    if (os === 'COMPLETED') return 4;
    if (shipmentStatus === 'DELIVERED') return 4;
    if (shipmentStatus === 'IN_TRANSIT' || isShipmentProblem) return 3;
    if (hasCarrier || shipmentStatus === 'READY_FOR_PICKUP') return 3;
    if (os === 'FINISHED') return 2;
    if (os === 'PROCESSING' && canFulfill) return 1;
    if (os === 'PENDING' && isCod) return 1;
    return 0;
  })();

  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'itemName',
      render: (name, r) => (
        <div>
          <Text strong>{name || r.variantName || shortId(r.id)}</Text>
          {r.sourceType && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{r.sourceType}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'SL',
      dataIndex: 'quantityOrdered',
      width: 56,
      align: 'center',
      render: (q, r) => q ?? r.quantity ?? 1,
    },
    {
      title: 'Tiến độ SX',
      dataIndex: 'displayFulfillmentStatus',
      width: 120,
      render: (s) => renderFulfillment(s),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      render: (_, r) => {
        const fs = normStatus(r.displayFulfillmentStatus || r.fulfillmentStatus);
        if (fs === 'FINISHED' || fs === 'CANCELLED') {
          return <Text type="secondary">—</Text>;
        }
        if (os !== 'PROCESSING' || !canFulfill) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isCod ? 'Cần đơn PROCESSING' : 'Cần đơn PROCESSING + đã TT'}
            </Text>
          );
        }
        const loadingBtn = busyItemId === r.id;
        return (
          <Popconfirm
            title="Xác nhận đã hoàn tất / đóng gói dòng hàng?"
            onConfirm={() => handleFulfillment(r.id)}
          >
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loadingBtn}
            >
              Hoàn tất / đóng gói
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Modal
      title={order ? `Đơn hàng #${order.code || (order.code || '—')}` : 'Chi tiết đơn hàng'}
      open={open}
      onCancel={onClose}
      width={900}
      destroyOnClose
      footer={null}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingTop: 8 } }}
    >
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <Button onClick={refresh} disabled={loading}>
          Làm mới
        </Button>
      </div>

      {loading && !order ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : order ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Steps
            size="small"
            current={workflowStep}
            status={isShipmentProblem ? 'error' : undefined}
            items={[
              {
                title: isCod ? 'COD' : 'Thanh toán',
                description: paid ? 'Đã TT' : isCod ? 'Thu khi giao' : 'Chờ TT',
                status: paid || isCod ? 'finish' : undefined,
              },
              {
                title: 'Sản xuất',
                description: allProductionFinished ? 'Hoàn tất' : 'Đang xử lý',
              },
              {
                title: 'Đóng gói',
                description: os === 'FINISHED' ? 'Sẵn sàng' : 'Chờ',
              },
              {
                title: 'Vận chuyển',
                description: isShipmentProblem
                  ? (shipmentStatusMap[shipmentStatus]?.label || shipmentStatus)
                  : shipmentStatus === 'DELIVERED' ? 'Đã giao'
                  : shipmentStatus === 'IN_TRANSIT' ? 'Đang giao'
                  : hasCarrier ? 'Có vận đơn'
                  : 'Chưa có',
                status: isShipmentProblem ? 'error' : undefined,
              },
              {
                title: 'Hoàn thành',
                description: os === 'COMPLETED' ? 'OK' : '',
              },
            ]}
          />

          {!canFulfill && os === 'PENDING' && (
            <Alert type="warning" showIcon message="Đơn chưa thanh toán — chưa vào sản xuất." />
          )}

          {/* Đã xóa thông báo COD — hệ thống không hỗ trợ COD */}

          {readyForShip && (
            <Alert
              type="success"
              showIcon
              message={
                productionItems.length > 0
                  ? 'Tất cả sản phẩm đã in xong'
                  : 'Đã soạn / đóng gói xong'
              }
              description="Tất cả dòng hàng đã hoàn tất. Tiếp tục xử lý vận chuyển ở khối bên dưới."
            />
          )}

          {/* ─── Thông tin đơn hàng ─── */}
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mã đơn">
              <Text strong copyable={{ text: order.code }}>{order.code || '—'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{renderOrderStatus(order.orderStatus)}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{order.customerName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDateTime(order.created)}</Descriptions.Item>
          </Descriptions>

          {/* ─── Thanh toán & Hóa đơn ─── */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              <CreditCardOutlined style={{ color: '#6366f1' }} />
              <Text strong>Thanh toán</Text>
            </Space>
            <Descriptions size="small" column={2} style={{ marginBottom: 0 }}>
              <Descriptions.Item label="Trạng thái">
                {isCod && !paid ? (
                  <Tag color="blue">COD · thu khi giao</Tag>
                ) : (
                  <Tag color={paid ? 'success' : 'warning'}>
                    {paid ? 'Đã thanh toán' : (order.invoice?.paymentStatus || 'Chờ TT')}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức">
                {(() => {
                  const pm = normStatus(order.invoice?.paymentMethod);
                  if (pm === 'VNPAY') return <Tag color="blue">VNPay</Tag>;
                  if (pm === 'PAYOS') return <Tag color="orange">PayOS</Tag>;
                  if (pm === 'CASH') return <Tag color="cyan">Tiền mặt / COD</Tag>;
                  return <Text type="secondary">{order.invoice?.paymentMethod || '—'}</Text>;
                })()}
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '8px 0' }} />
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              {(() => {
                const inv = order.invoice || {};
                const subTotal = inv.subTotal ?? inv.SubTotal ?? 0;
                const shipFee = inv.shippingFee ?? inv.ShippingFee ?? order.shipment?.shippingFee ?? 0;
                const total = inv.totalAmount ?? inv.TotalAmount ?? order.totalPrice ?? 0;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Tiền hàng</Text>
                      <Text>{formatVnd(subTotal > 0 ? subTotal : total - shipFee)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Phí vận chuyển</Text>
                      <Text>{shipFee > 0 ? formatVnd(shipFee) : 'Miễn phí'}</Text>
                    </div>
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>Tổng cộng</Text>
                      <Text strong style={{ color: '#4f46e5', fontSize: 15 }}>{formatVnd(total)}</Text>
                    </div>
                  </>
                );
              })()}
            </Space>
          </div>

          {/* ─── Vận chuyển overview ─── */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              <TruckOutlined style={{ color: '#0891b2' }} />
              <Text strong>Vận chuyển</Text>
            </Space>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Trạng thái VC">
                {shipmentStatus ? renderShipmentStatus(shipmentStatus) : <Tag>Chưa có vận đơn</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị">
                {(() => {
                  const c = normStatus(order.shipment?.carrier || order.shipment?.carrierName);
                  if (c === 'GHN') return <Tag color="orange">GHN — Giao Hàng Nhanh</Tag>;
                  if (c === 'MANUAL') return <Tag>Giao thủ công</Tag>;
                  return <Text type="secondary">{CARRIER_LABELS[c] || order.shipment?.carrierName || '—'}</Text>;
                })()}
              </Descriptions.Item>
              {(order.shipment?.carrierOrderCode || order.shipment?.trackingNumber) && (
                <Descriptions.Item label="Mã vận đơn" span={2}>
                  <Text copyable strong style={{ fontFamily: 'monospace' }}>
                    {order.shipment?.carrierOrderCode || order.shipment?.trackingNumber}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          {/* ─── Địa chỉ giao hàng ─── */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              <EnvironmentOutlined style={{ color: '#16a34a' }} />
              <Text strong>Địa chỉ giao hàng</Text>
            </Space>
            {(() => {
              const addr = order.shipment?.shippingAddress || {};
              const fullAddress = order.shippingAddress || order.shipment?.fullAddress;
              const receiverName = addr.receiverName || addr.ReceiverName;
              const phone = addr.phone || addr.Phone;
              const addressLine = addr.addressLine || addr.AddressLine;
              const parts = [addr.ward, addr.district, addr.city, addr.province].filter(Boolean);
              const hasGhn = Boolean((addr.ghnDistrictId || addr.GhnDistrictId) > 0);

              if (!receiverName && !fullAddress) {
                return <Text type="secondary">Chưa có thông tin địa chỉ</Text>;
              }

              return (
                <div>
                  {receiverName && (
                    <div>
                      <Text strong>{receiverName}</Text>
                      {phone && <Text type="secondary" style={{ marginLeft: 8 }}>| {phone}</Text>}
                    </div>
                  )}
                  {addressLine && <div><Text>{addressLine}</Text></div>}
                  {parts.length > 0 && <div><Text type="secondary">{parts.join(', ')}</Text></div>}
                  {!addressLine && !parts.length && fullAddress && (
                    <div><Text>{fullAddress}</Text></div>
                  )}
                  {hasGhn && (
                    <Tag color="green" style={{ marginTop: 4, fontSize: 10 }}>Có mã GHN</Tag>
                  )}
                </div>
              );
            })()}
          </div>

          <div>
            <Title level={5} style={{ marginBottom: 8 }}>
              Sản phẩm ({order.items?.length || 0})
            </Title>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={displayItems}
              columns={itemColumns}
            />
          </div>

          {/* Ghi chú khách hàng */}
          {order.note && (
            <Alert
              type="info"
              showIcon
              message="Ghi chú từ khách hàng"
              description={order.note}
              style={{ borderRadius: 8 }}
            />
          )}

          <Input.TextArea
            rows={2}
            placeholder="Ghi chú nội bộ (tùy chọn) — gắn khi cập nhật trạng thái"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* Tổng cân nặng ước tính — hỗ trợ nhập khối lượng cho GHN */}
          {(() => {
            const items = order?.items || [];
            const totalWeight = items.reduce((sum, it) => {
              const w = it.estimatedWeightPerUnit || it.weight || 0;
              const q = it.quantityOrdered || it.quantity || 1;
              return sum + w * q;
            }, 0);
            return totalWeight > 0 ? (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Tổng cân nặng ước tính:</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>
                  {totalWeight.toLocaleString()}g
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                    ({(totalWeight / 1000).toFixed(2)} kg)
                  </span>
                </div>
              </div>
            ) : null;
          })()}

          <StaffCarrierActions
            orderId={order.id}
            orderStatus={order.orderStatus}
            orderItems={order.items || []}
            shipmentSummary={order.shipment}
            onUpdated={refresh}
          />
        </Space>
      ) : (
        <Alert type="error" message="Không có dữ liệu đơn hàng" />
      )}
    </Modal>
  );
}
