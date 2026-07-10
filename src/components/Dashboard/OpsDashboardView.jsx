import React from "react";
import { Spin, Alert, Card, Row, Col, Typography, Space, Tag, List, Button, Statistic } from "antd";
import { useNavigate } from "react-router-dom";
import { useStaffWorkbench } from "../../hooks/useStaffWorkbench";

const { Title, Text } = Typography;

export default function OpsDashboardView({ role }) {
  const navigate = useNavigate();
  const { loading, error, workbench, reload } = useStaffWorkbench();

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
              <Statistic title="MF2 mới gửi" value={counts.mf2Submitted ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="MF2 chờ xử lý" value={counts.mf2Pending ?? 0} />
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
            <Tag>MF2 assign ≤ {sla.mf2AssignHours ?? 4}h</Tag>
            <Tag>Production stale &gt; {sla.productionStaleHours ?? 48}h</Tag>
            <Tag>GHN sau FINISHED &gt; {sla.ghnAfterFinishedHours ?? 24}h</Tag>
          </Space>
        </Card>

        <Card title="Việc cần làm">
          <List
            dataSource={tasks}
            locale={{ emptyText: "Không có task — mọi thứ ổn." }}
            renderItem={(task) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text strong>{task.title}</Text>
                      {task.priority != null && <Tag color="blue">P{task.priority}</Tag>}
                      {task.severity && <Tag color="volcano">{task.severity}</Tag>}
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
            )}
          />
        </Card>
      </Space>
    </div>
  );
}
