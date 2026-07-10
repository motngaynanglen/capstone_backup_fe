import React from 'react';
import { Typography, Table } from 'antd';
import { formatVnd } from './quoteBreakdownUtils';

const { Text } = Typography;

/**
 * Hiển thị bảng báo giá chi tiết: thành phần → vật liệu → gram × đơn giá + tiền thiết kế.
 */
export default function QuoteBreakdownDisplay({ breakdown, compact = false }) {
  const data = breakdown?.quoteBreakdown ?? breakdown;
  if (!data?.components?.length && data?.Components?.length) {
    // PascalCase fallback from raw JSON
    return (
      <QuoteBreakdownDisplay
        breakdown={{
          quoteBreakdown: {
            components: (data.Components || []).map((c) => ({
              name: c.Name ?? c.name,
              quantity: c.Quantity ?? c.quantity,
              lineTotal: c.LineTotal ?? c.lineTotal,
              materials: (c.Materials || c.materials || []).map((m) => ({
                materialName: m.MaterialName ?? m.materialName,
                gramsPerUnit: m.GramsPerUnit ?? m.gramsPerUnit,
                componentQuantity: m.ComponentQuantity ?? m.componentQuantity,
                totalGrams: m.TotalGrams ?? m.totalGrams,
                pricePerGram: m.PricePerGram ?? m.pricePerGram,
                lineTotal: m.LineTotal ?? m.lineTotal,
              })),
            })),
            materialSubtotal: data.MaterialSubtotal ?? data.materialSubtotal,
            laborCost: data.LaborCost ?? data.laborCost,
            total: data.Total ?? data.total,
          },
        }}
        compact={compact}
      />
    );
  }

  const bd = data?.components?.length ? data : null;
  if (!bd?.components?.length) return null;

  const materialSubtotal = bd.materialSubtotal ?? 0;
  const laborCost = bd.laborCost ?? 0;

  const rows = [];
  bd.components.forEach((comp, ci) => {
    (comp.materials || []).forEach((mat, mi) => {
      rows.push({
        key: `${ci}-${mi}`,
        component: comp.name,
        quantity: comp.quantity,
        material: mat.materialName,
        gramsPerUnit: mat.gramsPerUnit,
        totalGrams: mat.totalGrams,
        pricePerGram: mat.pricePerGram,
        lineTotal: mat.lineTotal,
      });
    });
  });

  const columns = [
    { title: 'Thành phần', dataIndex: 'component', key: 'component', width: 100 },
    { title: 'Vật liệu', dataIndex: 'material', key: 'material' },
    {
      title: 'Định lượng',
      key: 'grams',
      render: (_, r) => `${r.gramsPerUnit} g/sp × ${r.quantity} = ${r.totalGrams} g`,
    },
    {
      title: 'Đ/g',
      dataIndex: 'pricePerGram',
      key: 'pricePerGram',
      align: 'right',
      render: (v) => Number(v).toLocaleString('vi-VN'),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right',
      render: (v) => formatVnd(v),
    },
  ];

  return (
    <div
      style={{
        marginTop: compact ? 8 : 12,
        padding: compact ? 10 : 12,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e0e7ff',
      }}
    >
      <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#4338ca' }}>
        Chi tiết báo giá
      </Text>
      <Table
        size="small"
        pagination={false}
        columns={columns}
        dataSource={rows}
        scroll={compact ? undefined : { x: 480 }}
      />
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
          <span>Tổng vật liệu</span>
          <span>{formatVnd(materialSubtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginTop: 4 }}>
          <span>Tiền thiết kế</span>
          <span>{formatVnd(laborCost)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            color: '#065f46',
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid #d1fae5',
          }}
        >
          <span>Tổng cộng</span>
          <span>{formatVnd(bd.total ?? materialSubtotal + laborCost)}</span>
        </div>
      </div>
    </div>
  );
}
