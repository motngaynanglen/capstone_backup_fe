import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Button, Card, Col, Empty, Rate, Row, Space, Spin, Statistic, Table, Tag, Typography,
} from 'antd';
import {
  ArrowRightOutlined, DollarOutlined, InboxOutlined, MessageOutlined, ReloadOutlined,
} from '@ant-design/icons';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getManagerDashboardApi } from '../../api/managerDashboardApi';
import { formatDateTime, formatVnd } from '../../utils/formatters';

const { Title, Text } = Typography;

const LOW_STOCK_GRAMS = 50000;

const chartTooltipFormatter = (value) => formatVnd(value);

export default function ManagerAdminDashboard({ role = 'manager' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const feedbackPath = role === 'admin' ? '/admin/feedback' : '/manager/feedback';
  const inventoryPath = role === 'admin' ? '/admin/inventory' : '/manager/inventory';
  const materialsPath = role === 'admin' ? '/admin/materials' : '/manager/materials';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getManagerDashboardApi();
      setData(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải báo cáo dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" tip="Đang tải báo cáo..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được dashboard"
        description={error}
        action={<Button onClick={loadDashboard}>Thử lại</Button>}
      />
    );
  }

  const revenue = data?.revenue || {};
  const materialStock = data?.materialStock || [];
  const lowStockMaterials = materialStock.filter((m) => m.isLowStock);
  const recentFeedbacks = data?.recentFeedbacks || [];
  const chartData = (revenue.monthlyTrend || []).map((item) => ({
    name: item.label,
    amount: Number(item.amount) || 0,
  }));

  const materialColumns = [
    {
      title: 'Vật liệu',
      dataIndex: 'materialName',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Tồn kho (g)',
      dataIndex: 'stockQuantityGrams',
      align: 'right',
      width: 140,
      render: (grams, row) => {
        const qty = Number(grams) || 0;
        return (
          <Text style={{ fontWeight: 700, color: row.isLowStock ? '#dc2626' : '#059669' }}>
            {qty.toLocaleString()} g
          </Text>
        );
      },
    },
    {
      title: 'Tồn SP',
      dataIndex: 'totalStock',
      align: 'right',
      width: 100,
      render: (qty) => qty ?? 0,
    },
    {
      title: 'Biến thể',
      dataIndex: 'variantCount',
      align: 'center',
      width: 100,
      render: (count, row) => `${row.activeVariantCount || 0}/${count || 0} active`,
    },
    {
      title: 'Cảnh báo',
      dataIndex: 'isLowStock',
      align: 'center',
      width: 130,
      render: (isLow, row) => {
        if (isLow) {
          return <Tag color="red">Dưới {LOW_STOCK_GRAMS.toLocaleString()}g</Tag>;
        }
        if ((row.lowStockVariantCount || 0) > 0) {
          return <Tag color="orange">{row.lowStockVariantCount} SP thấp</Tag>;
        }
        return <Tag color="green">Ổn</Tag>;
      },
    },
  ];

  const feedbackColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerFullName',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'designTemplateName',
      ellipsis: true,
      render: (name) => name || '—',
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      width: 130,
      render: (rating) => <Rate disabled value={rating} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'comment',
      ellipsis: true,
      render: (comment) => comment || <Text type="secondary">Không có ghi chú</Text>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'created',
      width: 150,
      render: (date) => formatDateTime(date),
    },
    {
      title: 'TT',
      dataIndex: 'staffReply',
      width: 90,
      render: (reply, row) => (
        row.isHidden
          ? <Tag>Ẩn</Tag>
          : reply
            ? <Tag color="green">Đã trả lời</Tag>
            : <Tag color="gold">Chờ</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Báo cáo doanh thu, tồn kho vật liệu và phản hồi khách hàng</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadDashboard}>Làm mới</Button>
      </div>

      {/* Doanh thu */}
      <Title level={5} style={{ marginBottom: 12 }}>
        <DollarOutlined style={{ marginRight: 8 }} />
        Báo cáo doanh thu
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đã thu"
              value={revenue.totalCollected || 0}
              formatter={(v) => formatVnd(v)}
              valueStyle={{ color: '#059669', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng này"
              value={revenue.thisMonthCollected || 0}
              formatter={(v) => formatVnd(v)}
              valueStyle={{ color: '#2563eb', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giao dịch thành công"
              value={revenue.successfulTransactionCount || 0}
              suffix="lần"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ thu (hóa đơn)"
              value={revenue.pendingInvoiceAmount || 0}
              formatter={(v) => formatVnd(v)}
              valueStyle={{ color: '#d97706', fontSize: 20 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {revenue.pendingInvoiceCount || 0} hóa đơn chưa thanh toán đủ
            </Text>
          </Card>
        </Col>
      </Row>

      <Card title="Xu hướng 6 tháng gần nhất" style={{ marginBottom: 24 }}>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={56} />
              <Tooltip formatter={chartTooltipFormatter} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="Chưa có dữ liệu doanh thu" />
        )}
      </Card>

      {/* Tồn kho vật liệu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>
          <InboxOutlined style={{ marginRight: 8 }} />
          Báo cáo tồn kho vật liệu (gram)
        </Title>
        <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate(inventoryPath)}>
          Chi tiết kho SP
        </Button>
      </div>
      {lowStockMaterials.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Cần nhập bổ sung vật liệu"
          description={
            <>
              {lowStockMaterials.length} vật liệu dưới ngưỡng {LOW_STOCK_GRAMS.toLocaleString()}g:{' '}
              <Text strong>{lowStockMaterials.map((m) => m.materialName).join(', ')}</Text>
              {' '}
              <Button type="link" size="small" onClick={() => navigate(materialsPath)}>
                Nhập kho ngay
              </Button>
            </>
          }
        />
      )}
      <Card style={{ marginBottom: 24 }}>
        <Table
          rowKey="materialId"
          columns={materialColumns}
          dataSource={materialStock}
          pagination={false}
          size="middle"
          locale={{ emptyText: <Empty description="Chưa có dữ liệu tồn kho theo vật liệu" /> }}
          summary={(rows) => {
            if (!rows.length) return null;
            const totalGrams = rows.reduce((sum, row) => sum + (Number(row.stockQuantityGrams) || 0), 0);
            const totalProducts = rows.reduce((sum, row) => sum + (row.totalStock || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}><Text strong>Tổng cộng</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{totalGrams.toLocaleString()} g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>{totalProducts}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Phản hồi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>
          <MessageOutlined style={{ marginRight: 8 }} />
          Danh sách phản hồi khách hàng
        </Title>
        <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate(feedbackPath)}>
          Quản lý phản hồi
        </Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          columns={feedbackColumns}
          dataSource={recentFeedbacks}
          pagination={false}
          size="middle"
          locale={{ emptyText: <Empty description="Chưa có phản hồi nào" /> }}
        />
        {recentFeedbacks.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Space>
              <Text type="secondary">Hiển thị {recentFeedbacks.length} phản hồi mới nhất</Text>
              <Button type="primary" ghost size="small" onClick={() => navigate(feedbackPath)}>
                Xem tất cả
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
}
