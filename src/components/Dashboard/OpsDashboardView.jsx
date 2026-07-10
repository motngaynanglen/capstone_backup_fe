import React, { useMemo, useState } from "react";
import { Spin, Alert, Card, Row, Col, Typography, Space, Tag, List, Button, Statistic, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { useStaffWorkbench } from "../../hooks/useStaffWorkbench";

const { Title, Text } = Typography;

const TASK_TYPE_OPTIONS = [
  { value: "ALL", label: "Tất cả loại việc" },
  { value: "QUOTE", label: "Báo giá" },
  { value: "ORDER_CONFIRM", label: "Xác nhận đơn" },
  { value: "PRODUCTION", label: "Sản xuất" },
  { value: "SHIPPING", label: "Giao hàng" },
  { value: "FOLLOW_UP", label: "Theo dõi" },
];

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "Tất cả ưu tiên" },
  { value: "HIGH", label: "Cao" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "LOW", label: "Thấp" },
];

const PRIORITY_COLORS = {
  HIGH: "red",
  MEDIUM: "orange",
  LOW: "default",
};

const TASK_TYPE_COLORS = {
  QUOTE: "purple",
  ORDER_CONFIRM: "blue",
  PRODUCTION: "geekblue",
  SHIPPING: "cyan",
  FOLLOW_UP: "default",
};

const PRIORITY_SORT = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function resolveTaskType(task) {
  return task.taskType || "FOLLOW_UP";
}

function resolveTaskTypeLabel(task) {
  return task.taskTypeLabel || TASK_TYPE_OPTIONS.find((o) => o.value === resolveTaskType(task))?.label || "Khác";
}

function resolvePriorityLevel(task) {
  if (task.priorityLevel) return task.priorityLevel;
  const sev = (task.severity || "").toLowerCase();
  if (sev === "critical" || sev === "high") return "HIGH";
  if (sev === "medium") return "MEDIUM";
  return "LOW";
}

function resolvePriorityLabel(task) {
  return task.priorityLabel || PRIORITY_OPTIONS.find((o) => o.value === resolvePriorityLevel(task))?.label || "Thấp";
}

export default function OpsDashboardView({ role }) {
  const navigate = useNavigate();
  const { loading, error, workbench, reload } = useStaffWorkbench();
  const [taskTypeFilter, setTaskTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const filteredTasks = useMemo(() => {
    const tasks = workbench?.tasks || [];
    return tasks
      .filter((task) => {
        if (taskTypeFilter !== "ALL" && resolveTaskType(task) !== taskTypeFilter) return false;
        if (priorityFilter !== "ALL" && resolvePriorityLevel(task) !== priorityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const p = (PRIORITY_SORT[resolvePriorityLevel(a)] ?? 9) - (PRIORITY_SORT[resolvePriorityLevel(b)] ?? 9);
        return p !== 0 ? p : (a.priority ?? 99) - (b.priority ?? 99);
      });
  }, [workbench?.tasks, taskTypeFilter, priorityFilter]);

  const taskTypeCounts = useMemo(() => {
    const counts = {};
    (workbench?.tasks || []).forEach((task) => {
      const type = resolveTaskType(task);
      counts[type] = (counts[type] || 0) + (task.count || 0);
    });
    return counts;
  }, [workbench?.tasks]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Không tải được bàn làm việc"
          description={error}
          showIcon
          action={
            <Button size="small" onClick={reload}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  const { tasks = [], counts = {}, sla = {}, health = {} } = workbench || {};

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            {role === "admin" ? "Bàn điều hành" : "Bàn làm việc"}
          </Title>
          <Space wrap>
            {role === "staff" && (
              <>
                <Button type="primary" onClick={() => navigate("/staff/production-queue")}>
                  Hàng đợi SX
                </Button>
                <Button onClick={() => navigate("/staff/shop-orders")}>
                  Đơn shop & GHN
                </Button>
              </>
            )}
            <Button onClick={reload}>Làm mới</Button>
          </Space>
        </div>

        {!health?.allClear && (
          <Alert
            type={health?.critical > 0 ? "error" : "warning"}
            message={`Cảnh báo vận hành · ${health?.total ?? 0} điểm cần xem`}
            description={
              <span>
                Critical: <b>{health?.critical ?? 0}</b> · High: <b>{health?.high ?? 0}</b>
              </span>
            }
            showIcon
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Hàng chờ SX" value={counts.productionQueueCount ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Yêu cầu mới gửi" value={counts.mf2Submitted ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Yêu cầu chờ xử lý" value={counts.mf2Pending ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Sẵn sàng GHN" value={counts.ordersReadyGhn ?? 0} />
            </Card>
          </Col>
        </Row>

        <Card size="small" title="SLA (giờ)">
          <Space wrap>
            <Tag>Tiếp nhận yêu cầu ≤ {sla.mf2AssignHours ?? 4}h</Tag>
            <Tag>Production stale &gt; {sla.productionStaleHours ?? 48}h</Tag>
            <Tag>GHN sau FINISHED &gt; {sla.ghnAfterFinishedHours ?? 24}h</Tag>
          </Space>
        </Card>

        <Card size="small" title="Tóm tắt theo loại việc">
          <Space wrap>
            {TASK_TYPE_OPTIONS.filter((o) => o.value !== "ALL").map((opt) => (
              <Tag
                key={opt.value}
                color={TASK_TYPE_COLORS[opt.value]}
                style={{ cursor: "pointer" }}
                onClick={() => setTaskTypeFilter(taskTypeFilter === opt.value ? "ALL" : opt.value)}
              >
                {opt.label}: {taskTypeCounts[opt.value] || 0}
              </Tag>
            ))}
          </Space>
        </Card>

        <Card
          title="Việc cần làm"
          extra={
            <Space wrap>
              <Select
                value={taskTypeFilter}
                onChange={setTaskTypeFilter}
                options={TASK_TYPE_OPTIONS}
                style={{ minWidth: 160 }}
                size="small"
              />
              <Select
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={PRIORITY_OPTIONS}
                style={{ minWidth: 140 }}
                size="small"
              />
            </Space>
          }
        >
          <List
            dataSource={filteredTasks}
            locale={{
              emptyText:
                tasks.length === 0
                  ? "Không có task — mọi thứ ổn."
                  : "Không có việc phù hợp bộ lọc.",
            }}
            renderItem={(task) => {
              const type = resolveTaskType(task);
              const priorityLevel = resolvePriorityLevel(task);
              return (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <Text strong>{task.title}</Text>
                        <Tag color={TASK_TYPE_COLORS[type]}>{resolveTaskTypeLabel(task)}</Tag>
                        <Tag color={PRIORITY_COLORS[priorityLevel]}>{resolvePriorityLabel(task)}</Tag>
                        {task.count != null && <Tag>{task.count}</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        {task.description && <Text type="secondary">{task.description}</Text>}
                        <Space wrap>
                          {task.primaryHref && (
                            <Button type="primary" size="small" onClick={() => navigate(task.primaryHref)}>
                              {task.actionLabel || "Mở"}
                            </Button>
                          )}
                          {task.href && task.href !== task.primaryHref && (
                            <Button size="small" onClick={() => navigate(task.href)}>
                              Chi tiết
                            </Button>
                          )}
                        </Space>
                        {task.items?.length > 0 && (
                          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                            {task.items.map((it) => (
                              <li key={it.key || it.label}>
                                {it.href ? (
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(it.href);
                                    }}
                                  >
                                    {it.label}
                                  </a>
                                ) : (
                                  it.label
                                )}
                                {it.meta != null && it.meta !== "" && (
                                  <Text type="secondary" style={{ marginLeft: 6 }}>
                                    ({it.meta})
                                  </Text>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      </Space>
    </div>
  );
}
