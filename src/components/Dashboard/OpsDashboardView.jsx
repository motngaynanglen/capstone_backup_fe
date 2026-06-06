import React from "react";
import { Spin, Alert, Card, Row, Col, Typography, Space, Tag, List, Button, Statistic } from "antd";
import { useNavigate } from "react-router-dom";
import { useStaffWorkbench } from "../../hooks/useStaffWorkbench";

const { Title, Text } = Typography;

const summaryCards = [
  {
    title: "Thiết kế quá hạn",
    valueKey: "overdueDesigns",
    description: "Chưa tiếp nhận quá SLA",
    href: "/staff/custom-orders",
  },
  {
    title: "Sản xuất chậm",
    valueKey: "staleProduction",
    description: "Quá 48h chưa in xong",
    href: "/staff/production-queue",
  },
  {
    title: "Chậm tạo vận đơn",
    valueKey: "shippingOverdue",
    description: "Quá 24h sau khi sẵn sàng giao",
    href: "/staff/shop-orders",
  },
  {
    title: "Vận đơn cần xử lý",
    valueKey: "shipmentActionCount",
    description: "Đóng gói, chờ lấy, lỗi, hoàn hàng",
    href: "/staff/shop-orders",
  },
];

function severityColor(severity) {
  if (severity === "critical") return "red";
  if (severity === "high") return "orange";
  return "blue";
}

function severityLabel(severity) {
  if (severity === "critical") return "Khẩn cấp";
  if (severity === "high") return "Cần chú ý";
  return "Theo dõi";
}

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
                  Đơn shop & vận chuyển
                </Button>
              </>
            )}
            <Button onClick={reload}>Làm mới</Button>
          </Space>
        </div>

        {!health?.allClear && (
          <Alert
            type={health?.critical > 0 ? "error" : "warning"}
            message={`Cảnh báo vận hành · ${health?.total ?? 0} việc cần xem`}
            description={
              <span>
                Khẩn cấp: <b>{health?.critical ?? 0}</b> · Cần chú ý: <b>{health?.high ?? 0}</b>
              </span>
            }
            showIcon
          />
        )}

        <Row gutter={[16, 16]}>
          {summaryCards.map((card) => (
            <Col xs={24} sm={12} md={6} key={card.valueKey}>
              <Card
                hoverable
                onClick={() => navigate(card.href)}
                style={{ height: "100%", cursor: "pointer" }}
                bodyStyle={{ minHeight: 132 }}
              >
                <Statistic title={card.title} value={counts[card.valueKey] ?? 0} />
                <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
                  {card.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Card size="small" title="SLA (giờ)">
          <Space wrap>
            <Tag>Tiếp nhận thiết kế ≤ {sla.mf2AssignHours ?? 4}h</Tag>
            <Tag>Sản xuất chậm &gt; {sla.productionStaleHours ?? 48}h</Tag>
            <Tag>Vận chuyển sau FINISHED &gt; {sla.shippingAfterFinishedHours ?? sla.ghnAfterFinishedHours ?? 24}h</Tag>
          </Space>
        </Card>

        <Card title="Việc cần làm">
          <List
            dataSource={tasks}
            locale={{ emptyText: "Không có việc cần xử lý." }}
            renderItem={(task) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text strong>{task.title}</Text>
                      {task.priority != null && <Tag color="blue">P{task.priority}</Tag>}
                      {task.severity && (
                        <Tag color={severityColor(task.severity)}>
                          {severityLabel(task.severity)}
                        </Tag>
                      )}
                      {task.count != null && <Tag>{task.count} việc</Tag>}
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
