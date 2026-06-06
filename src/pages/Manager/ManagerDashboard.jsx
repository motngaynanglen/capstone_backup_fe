import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Spin, Alert, Card, Row, Col, Statistic, Table, Tag, Typography, Space, Button, Empty,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  getManagerDashboardApi, getRevenueChartApi, getOrdersBySourceTypeChartApi, getTopVariantsChartApi,
} from '../../api/managerDashboardApi';

const { Title, Text } = Typography;

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#84cc16', '#6b7280'];

const formatVnd = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0);
const formatNum = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);

// Chuẩn hóa points của chart → {name, value, count} cho recharts.
const toChartData = (series) =>
  (series?.points || series?.Points || []).map((p) => ({
    name: p.label ?? p.Label ?? p.key ?? p.Key,
    value: Number(p.value ?? p.Value ?? 0),
    count: Number(p.count ?? p.Count ?? 0),
  }));

// Status counts ([{status,label,count}]) → {name,value} (value = count) cho Pie.
const toStatusData = (list) =>
  (list || []).map((s) => ({
    name: s.label ?? s.Label ?? s.status ?? s.Status,
    value: Number(s.count ?? s.Count ?? 0),
  })).filter((x) => x.value > 0);

function StatusPie({ title, data }) {
  return (
    <Card size="small" title={title} styles={{ body: { paddingTop: 8 } }}>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => e.value}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [formatNum(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dash, setDash] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [sourceSeries, setSourceSeries] = useState([]);
  const [topVariants, setTopVariants] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const to = new Date();
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const iso = (d) => d.toISOString().slice(0, 10);

      const [dashRes, revRes, srcRes, topRes] = await Promise.allSettled([
        getManagerDashboardApi(),
        getRevenueChartApi({ from: iso(from), to: iso(to), groupBy: 'day' }),
        getOrdersBySourceTypeChartApi({ from: iso(from), to: iso(to) }),
        getTopVariantsChartApi({ limit: 8 }),
      ]);

      if (dashRes.status === 'fulfilled') setDash(dashRes.value?.data || null);
      else throw new Error('Không tải được dashboard quản lý');

      setRevenueSeries(revRes.status === 'fulfilled' ? toChartData(revRes.value?.data) : []);
      setSourceSeries(srcRes.status === 'fulfilled' ? toStatusData(
        (srcRes.value?.data?.points || srcRes.value?.data?.Points || []).map((p) => ({
          label: p.label ?? p.Label, count: p.count ?? p.Count ?? p.value ?? p.Value,
        })),
      ) : []);
      setTopVariants(topRes.status === 'fulfilled' ? toChartData(topRes.value?.data) : []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || 'Lỗi tải dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalOrders = useMemo(
    () => (dash?.ordersByStatus || []).reduce((n, s) => n + (s.count ?? s.Count ?? 0), 0),
    [dash],
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;
  }
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" showIcon message="Không tải được dashboard" description={error}
          action={<Button size="small" onClick={load}>Thử lại</Button>} />
      </div>
    );
  }

  const rev = dash?.revenue || {};
  const actionItems = dash?.actionItems || [];
  const lowStock = dash?.lowStockVariants || [];
  const recentOrders = dash?.recentOrders || [];

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Tổng quan vận hành</Title>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>

      {/* KPI */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Doanh thu đã thu" value={formatVnd(rev.paidRevenue)} valueStyle={{ color: '#16a34a' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Doanh thu tháng này" value={formatVnd(rev.currentMonthPaidRevenue)} valueStyle={{ color: '#4f46e5' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Công nợ chưa thu" value={formatVnd(rev.unpaidAmount)} valueStyle={{ color: '#d97706' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Tổng đơn hàng" value={formatNum(totalOrders)} suffix={<Text type="secondary" style={{ fontSize: 12 }}>{`· HĐ: ${formatNum(rev.paidInvoiceCount)}/${formatNum((rev.paidInvoiceCount || 0) + (rev.unpaidInvoiceCount || 0))}`}</Text>} /></Card></Col>
      </Row>

      {/* Cảnh báo cần xử lý */}
      {actionItems.length > 0 && (
        <Card title="Cảnh báo cần xử lý" style={{ marginTop: 16 }} size="small">
          <Space wrap>
            {actionItems.map((a) => (
              <Tag key={a.key ?? a.Key} color={(a.severity ?? a.Severity) === 'CRITICAL' ? 'red' : (a.severity ?? a.Severity) === 'WARNING' ? 'orange' : 'default'}
                style={{ padding: '4px 10px', fontSize: 13 }}>
                {(a.label ?? a.Label)}: <b>{formatNum(a.count ?? a.Count)}</b>
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* Doanh thu theo ngày */}
      <Card title="Doanh thu 30 ngày gần nhất" style={{ marginTop: 16 }} size="small">
        {revenueSeries.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" /> : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueSeries} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toLocaleString('vi-VN')}k`} tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={(v) => formatVnd(v)} />
              <Line type="monotone" dataKey="value" name="Doanh thu" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Trạng thái */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}><StatusPie title="Đơn hàng theo trạng thái" data={toStatusData(dash?.ordersByStatus)} /></Col>
        <Col xs={24} md={8}><StatusPie title="Vận đơn theo trạng thái" data={toStatusData(dash?.shipmentsByStatus)} /></Col>
        <Col xs={24} md={8}><StatusPie title="Thiết kế theo trạng thái" data={toStatusData(dash?.designWorksByStatus)} /></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}><StatusPie title="Đơn theo loại nguồn (30 ngày)" data={sourceSeries} /></Col>
        <Col xs={24} md={14}>
          <Card size="small" title="Top sản phẩm bán chạy">
            {topVariants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topVariants} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n, p) => [formatNum(p?.payload?.count || v), 'Đã bán']} />
                  <Bar dataKey="count" name="Đã bán" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* Tồn kho thấp + Đơn gần đây */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}>
          <Card size="small" title="Tồn kho cần chú ý">
            <Table
              rowKey={(r) => r.id ?? r.Id}
              size="small"
              pagination={false}
              dataSource={lowStock}
              locale={{ emptyText: 'Tồn kho ổn định' }}
              columns={[
                { title: 'Mã', dataIndex: 'code', render: (_, r) => <Text className="font-mono" style={{ fontSize: 12 }}>{r.code ?? r.Code}</Text> },
                { title: 'Tên', dataIndex: 'name', ellipsis: true, render: (_, r) => r.name ?? r.Name },
                { title: 'Tồn/Min', align: 'right', render: (_, r) => {
                  const stock = r.stockQuantity ?? r.StockQuantity; const min = r.minimumStockLevel ?? r.MinimumStockLevel;
                  return <Text type={stock <= min ? 'danger' : undefined}>{formatNum(stock)} / {formatNum(min)}</Text>;
                } },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card size="small" title="Đơn hàng gần đây">
            <Table
              rowKey={(r) => r.id ?? r.Id}
              size="small"
              pagination={false}
              dataSource={recentOrders}
              locale={{ emptyText: 'Chưa có đơn' }}
              columns={[
                { title: 'Mã đơn', dataIndex: 'code', render: (_, r) => (
                  <Link to={`/staff/shop-orders?openOrderId=${r.id ?? r.Id}`} className="font-mono" style={{ fontSize: 12 }}>{r.code ?? r.Code}</Link>
                ) },
                { title: 'Khách', dataIndex: 'customerName', ellipsis: true, render: (_, r) => r.customerName ?? r.CustomerName ?? '—' },
                { title: 'Tổng tiền', align: 'right', render: (_, r) => formatVnd(r.totalPrice ?? r.TotalPrice) },
                { title: 'Trạng thái', render: (_, r) => <Tag>{r.orderStatus ?? r.OrderStatus}</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerDashboard;
