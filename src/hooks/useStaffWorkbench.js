import { useCallback, useEffect, useState } from 'react';
import { getStaffWorkbenchApi } from '../api/staffDashboardApi';

function pick(obj, camel, pascal) {
  if (!obj) return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (pascal && obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function mapWorkbenchPayload(res) {
  const data = res?.data;
  if (!data) return null;

  const workQueue = pick(data, 'workQueue', 'WorkQueue') || [];
  const byKey = (key) => {
    const item = workQueue.find((entry) => (pick(entry, 'key', 'Key')) === key);
    return pick(item, 'count', 'Count') ?? 0;
  };

  const rawTasks = pick(data, 'tasks', 'Tasks') || [];
  const sourceTasks = rawTasks.length > 0 ? rawTasks : workQueue;
  const tasks = sourceTasks
    .filter((t) => (pick(t, 'count', 'Count') ?? 0) > 0)
    .map((t) => {
      const rawSeverity = (pick(t, 'severity', 'Severity') || 'INFO').toUpperCase();
      const severity =
        rawSeverity === 'DANGER' || rawSeverity === 'CRITICAL'
          ? 'critical'
          : rawSeverity === 'WARNING'
            ? 'high'
            : 'low';
      const href = pick(t, 'primaryHref', 'PrimaryHref') || pick(t, 'href', 'Href');

      return {
        id: pick(t, 'id', 'Id') || pick(t, 'key', 'Key'),
        priority: pick(t, 'priority', 'Priority'),
        severity,
        title: pick(t, 'title', 'Title') || pick(t, 'label', 'Label'),
        description: pick(t, 'description', 'Description'),
        count: pick(t, 'count', 'Count') ?? 0,
        href: pick(t, 'href', 'Href'),
        primaryHref: href,
        actionLabel: pick(t, 'actionLabel', 'ActionLabel') || 'Mở',
        items: (pick(t, 'items', 'Items') || []).map((it) => ({
          key: pick(it, 'key', 'Key'),
          label: pick(it, 'label', 'Label'),
          meta: pick(it, 'meta', 'Meta'),
          href: pick(it, 'href', 'Href'),
        })),
      };
    });

  const sla = pick(data, 'sla', 'Sla') || {};
  const counts = pick(data, 'counts', 'Counts') || {};
  const health = pick(data, 'health', 'Health') || {};
  const critical = tasks.filter((t) => t.severity === 'critical').length;
  const high = tasks.filter((t) => t.severity === 'high').length;
  const total = tasks.reduce((sum, t) => sum + (Number(t.count) || 0), 0);
  const shipmentActionCount =
    byKey('shipments-preparing')
    + byKey('shipments-ready')
    + byKey('shipments-failed')
    + byKey('shipments-returning');

  return {
    sla: {
      mf2AssignHours: pick(sla, 'mf2AssignHours', 'Mf2AssignHours') ?? 4,
      productionStaleHours: pick(sla, 'productionStaleHours', 'ProductionStaleHours') ?? 48,
      shippingAfterFinishedHours:
        pick(sla, 'shippingAfterFinishedHours', 'ShippingAfterFinishedHours')
        ?? pick(sla, 'ghnAfterFinishedHours', 'GhnAfterFinishedHours')
        ?? 24,
    },
    counts: {
      productionQueueCount:
        pick(counts, 'productionQueueCount', 'ProductionQueueCount')
        ?? byKey('assigned-processing-orders'),
      mf2Submitted: pick(counts, 'mf2Submitted', 'Mf2Submitted') ?? byKey('mf2-overdue'),
      overdueDesigns: byKey('mf2-overdue'),
      staleProduction: byKey('production-stale'),
      shippingOverdue: byKey('ghn-overdue'),
      shipmentActionCount,
      mf2Pending:
        pick(counts, 'mf2Pending', 'Mf2Pending')
        ?? (byKey('assigned-design-in-progress') + byKey('assigned-design-reviewing')),
      ordersReadyShipment:
        pick(counts, 'ordersReadyShipment', 'OrdersReadyShipment')
        ?? pick(counts, 'ordersReadyGhn', 'OrdersReadyGhn')
        ?? (byKey('ghn-overdue') + byKey('assigned-finished-orders')),
    },
    health: {
      critical: pick(health, 'critical', 'Critical') ?? critical,
      high: pick(health, 'high', 'High') ?? high,
      total: pick(health, 'total', 'Total') ?? total,
      allClear: pick(health, 'allClear', 'AllClear') ?? (critical === 0 && high === 0),
    },
    tasks,
    recentOrders: pick(data, 'recentAssignedOrders', 'RecentAssignedOrders') || [],
    recentDesigns: pick(data, 'recentAssignedDesignWorks', 'RecentAssignedDesignWorks') || [],
  };
}

export function useStaffWorkbench() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workbench, setWorkbench] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffWorkbenchApi();
      const mapped = mapWorkbenchPayload(res);
      if (!mapped) {
        setError(res?.message || 'Không có dữ liệu bàn làm việc.');
        setWorkbench(null);
      } else {
        setWorkbench(mapped);
      }
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message
        || e?.message
        || 'Không tải được bàn làm việc. Kiểm tra API backend.';
      setError(msg);
      setWorkbench(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, workbench, reload: load };
}
