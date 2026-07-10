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

  const rawTasks = pick(data, 'tasks', 'Tasks') || [];
  const tasks = rawTasks.map((t) => ({
    id: pick(t, 'id', 'Id'),
    priority: pick(t, 'priority', 'Priority'),
    severity: pick(t, 'severity', 'Severity'),
    taskType: pick(t, 'taskType', 'TaskType'),
    taskTypeLabel: pick(t, 'taskTypeLabel', 'TaskTypeLabel'),
    priorityLevel: pick(t, 'priorityLevel', 'PriorityLevel'),
    priorityLabel: pick(t, 'priorityLabel', 'PriorityLabel'),
    title: pick(t, 'title', 'Title'),
    description: pick(t, 'description', 'Description'),
    count: pick(t, 'count', 'Count'),
    href: pick(t, 'href', 'Href'),
    primaryHref: pick(t, 'primaryHref', 'PrimaryHref'),
    actionLabel: pick(t, 'actionLabel', 'ActionLabel'),
    items: (pick(t, 'items', 'Items') || []).map((it) => ({
      key: pick(it, 'key', 'Key'),
      label: pick(it, 'label', 'Label'),
      meta: pick(it, 'meta', 'Meta'),
      href: pick(it, 'href', 'Href'),
    })),
  }));

  const sla = pick(data, 'sla', 'Sla') || {};
  const counts = pick(data, 'counts', 'Counts') || {};
  const health = pick(data, 'health', 'Health') || {};

  return {
    sla: {
      mf2AssignHours: pick(sla, 'mf2AssignHours', 'Mf2AssignHours') ?? 4,
      productionStaleHours: pick(sla, 'productionStaleHours', 'ProductionStaleHours') ?? 48,
      ghnAfterFinishedHours: pick(sla, 'ghnAfterFinishedHours', 'GhnAfterFinishedHours') ?? 24,
    },
    counts: {
      productionQueueCount: pick(counts, 'productionQueueCount', 'ProductionQueueCount') ?? 0,
      mf2Submitted: pick(counts, 'mf2Submitted', 'Mf2Submitted') ?? 0,
      mf2Pending: pick(counts, 'mf2Pending', 'Mf2Pending') ?? 0,
      ordersReadyGhn: pick(counts, 'ordersReadyGhn', 'OrdersReadyGhn') ?? 0,
    },
    health: {
      critical: pick(health, 'critical', 'Critical') ?? 0,
      high: pick(health, 'high', 'High') ?? 0,
      total: pick(health, 'total', 'Total') ?? 0,
      allClear: pick(health, 'allClear', 'AllClear') ?? true,
    },
    tasks,
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
