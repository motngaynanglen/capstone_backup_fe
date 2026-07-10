import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Space,
  Button,
  Steps,
  Alert,
  Divider,
  Typography,
  Spin,
  message,
  Popconfirm,
  Input,
} from 'antd';
import {
  CheckCircleOutlined,
  PrinterOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { getOrderDetailApi, updateOrderStatusApi, updateOrderItemFulfillmentApi } from '../../api/orderApi';
import { normalizeOrderDetail } from '../../utils/orderNormalize';
import { formatVnd, formatDateTime, shortId } from '../../utils/formatters';
import {
  orderStatusMap,
  shipmentStatusMap,
  fulfillmentStatusMap,
  isCustomManufacturing,
  isInStockItem,
  allOrderItemsReadyForShip,
  getStaffOrderStatusActions,
  isTerminalOrderStatus,
  normStatus,
} from '../../utils/staffOrderConstants';
import StaffCarrierActions from '../Shipping/StaffCarrierActions';

const { Text, Title } = Typography;

function renderOrderStatus(status) {
  const s = orderStatusMap[normStatus(status)];
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
  const [busyOrder, setBusyOrder] = useState(false);
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

  const handleFulfillment = async (orderItemId, fulfillmentStatus) => {
    setBusyItemId(orderItemId);
    try {
      const res = await updateOrderItemFulfillmentApi(orderItemId, {
        fulfillmentStatus,
        note: note.trim() || undefined,
      });
      const data = res?.data;
      message.success(data?.message || `Đã cập nhật → ${fulfillmentStatus}`);
      if (data?.allProductionLinesFinished) {
        message.info('Tất cả dòng đã hoàn thiện — chuyển đơn sang «Sẵn sàng giao» và tạo GHN.');
      }
      setNote('');
      await refresh();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Cập nhật tiến độ in thất bại');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleOrderStatus = async (orderStatus, shipmentStatus) => {
    setBusyOrder(true);
    try {
      await updateOrderStatusApi(orderId, {
        orderStatus,
        shipmentStatus: shipmentStatus || undefined,
        note: note.trim() || undefined,
      });
      message.success(`Đã chuyển đơn → ${orderStatus}`);
      setNote('');
      await refresh();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Cập nhật trạng thái đơn thất bại');
    } finally {
      setBusyOrder(false);
    }
  };

  const os = normStatus(order?.orderStatus);
  const ss = normStatus(order?.shipment?.shipmentStatus);
  const paid = normStatus(order?.invoice?.paymentStatus) === 'PAID';
  const isCod = Boolean(order?.invoice?.isCod);
  const canFulfill = paid || isCod;
  const isTerminal = isTerminalOrderStatus(os);
  const productionItems = (order?.items || []).filter((it) =>
    isCustomManufacturing(it.sourceType),
  );
  const allProductionFinished =
    productionItems.length === 0 ||
    productionItems.every((it) => normStatus(it.fulfillmentStatus) === 'FINISHED');
  const allItemsReady = allOrderItemsReadyForShip(order?.items || []);
  const readyForShip = os === 'PROCESSING' && canFulfill && allItemsReady;
  const hasCarrier = Boolean(order?.shipment?.carrierOrderCode);
  const orderStatusActions = getStaffOrderStatusActions({
    orderStatus: os,
    canFulfill,
    allItemsReady,
  });

  const workflowStep = (() => {
    if (os === 'COMPLETED') return 4;
    if (hasCarrier || ss === 'IN_TRANSIT') return 3;
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
      dataIndex: 'fulfillmentStatus',
      width: 120,
      render: (s) => renderFulfillment(s),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      render: (_, r) => {
        const fs = normStatus(r.fulfillmentStatus);
        const isProduction = isCustomManufacturing(r.sourceType);
        const isPicking = isInStockItem(r.sourceType);
        if (fs === 'FINISHED' || fs === 'CANCELLED') {
          return <Text type="secondary">—</Text>;
        }
        if (isTerminal || os !== 'PROCESSING' || !canFulfill) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isTerminal
                ? '—'
                : isCod
                  ? 'Cần đơn PROCESSING'
                  : 'Cần đơn PROCESSING + đã TT'}
            </Text>
          );
        }
        const loadingBtn = busyItemId === r.id;
        if (isPicking && fs === 'PICKING') {
          return (
            <Popconfirm
              title="Xác nhận đã soạn / đóng gói xong?"
              onConfirm={() => handleFulfillment(r.id, 'FINISHED')}
            >
              <Button size="small" type="primary" loading={loadingBtn}>
                Soạn xong
              </Button>
            </Popconfirm>
          );
        }
        if (!isProduction) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space wrap size={4}>
            {fs !== 'PRINTING' && (
              <Button
                size="small"
                type="primary"
                icon={<PrinterOutlined />}
                loading={loadingBtn}
                onClick={() => handleFulfillment(r.id, 'PRINTING')}
              >
                Bắt đầu in
              </Button>
            )}
            {fs === 'PRINTING' && (
              <Popconfirm
                title="Xác nhận hoàn thiện in?"
                onConfirm={() => handleFulfillment(r.id, 'FINISHED')}
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={loadingBtn}
                >
                  In xong
                </Button>
              </Popconfirm>
            )}
            {['PENDING', 'DESIGNING'].includes(fs) && (
              <Button
                size="small"
                loading={loadingBtn}
                onClick={() => handleFulfillment(r.id, 'FINISHED')}
              >
                Hoàn thiện
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      title={order ? `Đơn hàng #${order.code || shortId(order.id)}` : 'Chi tiết đơn hàng'}
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
            items={[
              {
                title: isCod ? 'COD' : 'Thanh toán',
                description: paid ? 'Đã TT' : isCod ? 'Thu khi giao' : 'Chờ TT',
                status: paid || isCod ? 'finish' : undefined,
              },
              { title: 'Sản xuất', description: allProductionFinished ? 'Xong' : 'Đang in' },
              { title: 'Sẵn sàng giao', description: os === 'FINISHED' ? 'OK' : 'Chờ' },
              { title: 'Vận chuyển', description: hasCarrier ? 'Đã tạo GHN' : 'Chờ GHN' },
              { title: 'Hoàn thành' },
            ]}
          />

          {!canFulfill && os === 'PENDING' && (
            <Alert type="warning" showIcon message="Đơn chưa thanh toán — chưa vào sản xuất." />
          )}

          {isCod && !paid && os !== 'COMPLETED' && (
            <Alert
              type="info"
              showIcon
              message="Đơn COD — thu tiền khi giao hàng"
              description="Có thể tiếp nhận và xử lý đơn mà không cần ghi nhận thanh toán trước."
            />
          )}

          {readyForShip && (
            <Alert
              type="success"
              showIcon
              message={
                productionItems.length > 0
                  ? 'Tất cả sản phẩm đã in xong'
                  : 'Đã soạn / đóng gói xong'
              }
              description="Bấm «Sẵn sàng giao» bên dưới để tạo vận đơn GHN."
            />
          )}

          {isTerminal && (
            <Alert
              type={os === 'CANCELLED' ? 'error' : 'success'}
              showIcon
              message={os === 'CANCELLED' ? 'Đơn đã hủy' : 'Đơn đã hoàn thành'}
            />
          )}

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mã đơn">{order.code || shortId(order.id)}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{renderOrderStatus(order.orderStatus)}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{order.customerName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Thanh toán">
              {isCod && !paid ? (
                <Tag color="blue">COD · thu khi giao</Tag>
              ) : (
                <Tag color={paid ? 'success' : 'warning'}>
                  {order.invoice?.paymentStatus || '—'}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong>{formatVnd(order.totalPrice)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDateTime(order.created)}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ giao" span={2}>
              {order.shippingAddress || order.shipment?.fullAddress || '—'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Title level={5} style={{ marginBottom: 8 }}>
              Sản phẩm ({order.items?.length || 0})
            </Title>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={order.items || []}
              columns={itemColumns}
            />
          </div>

          {!isTerminal && (
            <>
              <Input.TextArea
                rows={2}
                placeholder="Ghi chú nội bộ (tùy chọn) — gắn khi cập nhật trạng thái"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              {orderStatusActions.length > 0 ? (
                <>
                  <Divider orientation="left">Thao tác tiếp theo</Divider>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space wrap size="middle">
                      <Text type="secondary">Trạng thái hiện tại:</Text>
                      {renderOrderStatus(os)}
                      {ss && shipmentStatusMap[ss] && (
                        <Tag color={shipmentStatusMap[ss].color}>{shipmentStatusMap[ss].label}</Tag>
                      )}
                    </Space>
                    <Space wrap>
                      {orderStatusActions.map((action) => {
                        const btn = (
                          <Button
                            key={action.key}
                            type={action.primary ? 'primary' : 'default'}
                            icon={action.key === 'ready-for-ship' ? <SendOutlined /> : undefined}
                            loading={busyOrder}
                            onClick={
                              action.confirm
                                ? undefined
                                : () => handleOrderStatus(action.orderStatus, action.shipmentStatus)
                            }
                          >
                            {action.label}
                          </Button>
                        );
                        return action.confirm ? (
                          <Popconfirm
                            key={action.key}
                            title={action.confirm}
                            onConfirm={() =>
                              handleOrderStatus(action.orderStatus, action.shipmentStatus)
                            }
                          >
                            {btn}
                          </Popconfirm>
                        ) : (
                          btn
                        );
                      })}
                    </Space>
                    {orderStatusActions[0]?.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {orderStatusActions[0].description}
                      </Text>
                    )}
                  </Space>
                </>
              ) : os === 'FINISHED' || hasCarrier || ss === 'IN_TRANSIT' ? (
                <Alert
                  type="info"
                  showIcon
                  message="Đơn đang ở bước vận chuyển"
                  description="Dùng mục «Vận chuyển GHN» bên dưới để tạo vận đơn hoặc cập nhật trạng thái giao hàng."
                />
              ) : null}
            </>
          )}

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
