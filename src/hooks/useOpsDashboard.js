import { useCallback, useEffect, useState } from 'react';
import { queryOrdersApi, getProductionQueueApi } from '../api/orderApi';
import { getDesignRequests } from '../api/mainflow2Api';
import feedbackApi from '../api/feedbackApi';
import { queryShipmentsApi } from '../api/shipmentApi';
import { normalizeOrderRow } from '../utils/orderNormalize';

const MF2_ACTION_STATUSES = ['SUBMITTED', 'ASSIGNED', 'QUOTED', 'NEGOTIATING'];
const ORDER_ATTENTION = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHED'];

const CUSTOM_SOURCES = new Set([
  'CUSTOM_QUOTE_MF2',
  'CUSTOM_FILE_PRINT_MF2',
  'AI_GENERATED',
  'PRE_ORDER',
]);

const PRODUCTION_STALE_HOURS = 48;

function countByStatus(items, statusField = 'status') {
  const map = {};
  for (const item of items) {
    const s = item[statusField] || item.orderStatus || 'UNKNOWN';
    map[s] = (map[s] || 0) + 1;
  }
  return map;
}

function sumRevenue(orders) {
  return orders
    .filter((o) => o.invoice?.paymentStatus === 'PAID' || o.orderStatus === 'COMPLETED')
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);
}

export function useOpsDashboard(role = 'manager') {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orderPageSize = role === 'staff' ? 150 : 80;
      const tasks = [
        queryOrdersApi({
          pageNumber: 1,
          pageSize: orderPageSize,
          sortDescending: true,
          sortBy: 'created',
        }),
        getDesignRequests({ pageNumber: 1, pageSize: 100 }),
        feedbackApi.query({ pageNumber: 1, pageSize: 30 }),
      ];
      if (role === 'staff') {
        tasks.push(
          getProductionQueueApi({ pageNumber: 1, pageSize: 100, fulfillmentFilter: 'ALL' }),
        );
      }
      if (role !== 'staff') {
        tasks.push(queryShipmentsApi({ pageNumber: 1, pageSize: 40 }));
      }

      const results = await Promise.allSettled(tasks);
      const staffHasProduction = role === 'staff';
      const ordersRes = results[0];
      const mf2Res = results[1];
      const feedbackRes = results[2];
      const fourthRes = results[3];

      const rawOrders =
        ordersRes.status === 'fulfilled'
          ? ordersRes.value?.data || []
          : [];
      const orders = rawOrders.map(normalizeOrderRow).filter(Boolean);

      const mf2List =
        mf2Res.status === 'fulfilled' ? mf2Res.value?.data || [] : [];
      const feedbackList =
        feedbackRes.status === 'fulfilled' ? feedbackRes.value?.data || [] : [];
      const shipments =
        !staffHasProduction && fourthRes?.status === 'fulfilled'
          ? fourthRes.value?.data || []
          : [];
      const productionRes = staffHasProduction ? fourthRes : null;

      const orderStatusCounts = countByStatus(orders, 'orderStatus');
      const mf2StatusCounts = countByStatus(mf2List, 'status');

      const ordersReadyGhn = orders.filter(
        (o) => o.orderStatus === 'FINISHED' && !o.shipment?.carrierOrderCode,
      );
      const ordersNeedGhn = ordersReadyGhn;
      const ordersNoCarrier = orders.filter(
        (o) =>
          o.orderStatus === 'FINISHED' &&
          !o.shipment?.carrierOrderCode,
      );

      const productionList =
        staffHasProduction && productionRes?.status === 'fulfilled'
          ? productionRes.value?.data || []
          : [];
      const productionQueueCount = Array.isArray(productionList) ? productionList.length : 0;

      const now = Date.now();
      const productionStaleOrders = orders.filter((o) => {
        if (o.orderStatus !== 'PROCESSING') return false;
        if ((o.invoice?.paymentStatus || '').toUpperCase() !== 'PAID') return false;
        const hasCustom = (o.items || []).some((it) =>
          CUSTOM_SOURCES.has((it.sourceType || '').toUpperCase()),
        );
        if (!hasCustom) return false;
        const anchor = new Date(o.depositedAt || o.created || 0).getTime();
        if (Number.isNaN(anchor)) return false;
        const hours = (now - anchor) / (60 * 60 * 1000);
        if (hours < PRODUCTION_STALE_HOURS) return false;
        const pending = (o.items || []).some(
          (it) =>
            CUSTOM_SOURCES.has((it.sourceType || '').toUpperCase())
            && !['FINISHED', 'CANCELLED'].includes((it.fulfillmentStatus || '').toUpperCase()),
        );
        return pending;
      });

      const mf2Queue = mf2List
        .filter((r) => MF2_ACTION_STATUSES.includes(r.status))
        .slice(0, 8);

      const recentOrders = orders.slice(0, 8);
      const recentFeedback = feedbackList
        .filter((f) => !f.replyContent && !f.isReplied)
        .slice(0, 5);

      const shipmentsPending = shipments.filter(
        (s) => !s.carrierOrderCode && s.carrier === 'GHN',
      );

      setMetrics({
        orders,
        orderStatusCounts,
        ordersAttention: orders.filter((o) => ORDER_ATTENTION.includes(o.orderStatus)).length,
        ordersNeedGhn: ordersNeedGhn.length,
        ordersReadyGhn: ordersReadyGhn.length,
        ordersNoCarrier: ordersNoCarrier.length,
        productionQueueCount,
        productionStaleOrders,
        revenuePaidEstimate: sumRevenue(orders),
        mf2List,
        mf2StatusCounts,
        mf2Pending: MF2_ACTION_STATUSES.reduce(
          (n, s) => n + (mf2StatusCounts[s] || 0),
          0,
        ),
        mf2Queue,
        mf2Submitted: mf2StatusCounts.SUBMITTED || 0,
        feedbackPending: recentFeedback.length,
        recentFeedback,
        recentOrders,
        shipmentsPending: shipmentsPending.length,
        totalOrders: orders.length,
      });
    } catch (e) {
      console.error(e);
      setError('Không tải được dữ liệu tổng quan. Kiểm tra kết nối API.');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, metrics, reload: load };
}
