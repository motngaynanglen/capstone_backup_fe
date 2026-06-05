import React, { useEffect, useMemo, useState } from 'react';
import { Card, Radio, Checkbox, InputNumber, Switch, Typography, Tag, Spin } from 'antd';
import { getActiveServiceOptionsApi } from '../../api/serviceApi';

const { Text } = Typography;
const formatVnd = (n) => Number(n || 0).toLocaleString('vi-VN') + ' VND';

/**
 * Component chọn ServiceOption — dùng cho:
 * 1. CustomOrderRequestDesign: chọn gói dịch vụ thiết kế
 * 2. CustomOrderDetail: mua thêm lượt hiệu chỉnh (isAdjustmentOnly=true)
 *
 * Props:
 *   value: [{ serviceOptionId, quantity }]  — controlled
 *   onChange: (items) => void
 *   isAdjustmentOnly: boolean — chỉ hiện nhóm REVISION
 */
export default function ServiceOptionPicker({ value = [], onChange, isAdjustmentOnly = false }) {
  const [allOptions, setAllOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({}); // { optionId: quantity }

  useEffect(() => {
    setLoading(true);
    getActiveServiceOptionsApi()
      .then((res) => setAllOptions(res?.data || []))
      .catch(() => setAllOptions([]))
      .finally(() => setLoading(false));
  }, []);

  // Sync controlled value → internal state
  useEffect(() => {
    if (value?.length > 0) {
      const map = {};
      value.forEach((v) => { map[v.serviceOptionId] = v.quantity || 1; });
      setSelections(map);
    }
  }, []); // chỉ lần đầu

  // Group by groupCode
  const groups = useMemo(() => {
    const g = {};
    let filtered = allOptions;
    if (isAdjustmentOnly) {
      filtered = allOptions.filter((o) => o.groupCode === 'REVISION');
    }
    filtered.forEach((opt) => {
      const gc = opt.groupCode || 'OTHER';
      if (!g[gc]) g[gc] = { groupCode: gc, groupName: opt.groupName || gc, options: [] };
      g[gc].options.push(opt);
    });
    Object.values(g).forEach((group) => {
      group.options.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    });
    return Object.values(g);
  }, [allOptions, isAdjustmentOnly]);

  // Notify parent khi selection thay đổi
  useEffect(() => {
    const items = Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([optionId, quantity]) => ({ serviceOptionId: optionId, quantity }));
    onChange?.(items);
  }, [selections]);

  const handleSelect = (optionId, quantity, selectionType, groupCode) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (selectionType === 'SINGLE') {
        // Clear other options in same group
        allOptions
          .filter((o) => o.groupCode === groupCode && o.id !== optionId)
          .forEach((o) => delete next[o.id]);
        next[optionId] = quantity > 0 ? 1 : 0;
      } else if (selectionType === 'QUANTITY') {
        next[optionId] = quantity;
      } else {
        next[optionId] = quantity > 0 ? 1 : 0;
      }
      return next;
    });
  };

  const totalPrice = useMemo(() => {
    return Object.entries(selections).reduce((sum, [optId, qty]) => {
      const opt = allOptions.find((o) => o.id === optId);
      return sum + (opt?.defaultPrice || 0) * qty;
    }, 0);
  }, [selections, allOptions]);

  const totalAdjustmentRounds = useMemo(() => {
    return Object.entries(selections).reduce((sum, [optId, qty]) => {
      const opt = allOptions.find((o) => o.id === optId);
      if (opt?.groupCode === 'REVISION' && opt.adjustmentRoundDelta) {
        return sum + opt.adjustmentRoundDelta * qty;
      }
      return sum;
    }, 0);
  }, [selections, allOptions]);

  if (loading) return <div className="text-center py-8"><Spin /></div>;
  if (groups.length === 0) return <Text type="secondary">Chưa có tùy chọn dịch vụ nào.</Text>;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.groupCode} size="small"
          title={<span className="text-sm font-semibold">{group.groupName}</span>}
        >
          <div className="space-y-3">
            {group.options.map((opt) => {
              const selected = (selections[opt.id] || 0) > 0;
              return (
                <div key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {opt.selectionType === 'SINGLE' && (
                      <Radio
                        checked={selected}
                        onChange={(e) => handleSelect(opt.id, e.target.checked ? 1 : 0, 'SINGLE', opt.groupCode)}
                      />
                    )}
                    {opt.selectionType === 'MULTIPLE' && (
                      <Checkbox
                        checked={selected}
                        onChange={(e) => handleSelect(opt.id, e.target.checked ? 1 : 0, 'MULTIPLE', opt.groupCode)}
                      />
                    )}
                    {opt.selectionType === 'ADDON' && (
                      <Switch
                        checked={selected}
                        onChange={(checked) => handleSelect(opt.id, checked ? 1 : 0, 'ADDON', opt.groupCode)}
                        size="small"
                      />
                    )}
                    {opt.selectionType === 'QUANTITY' && (
                      <InputNumber
                        min={0}
                        max={opt.maxQuantity || 99}
                        value={selections[opt.id] || 0}
                        onChange={(val) => handleSelect(opt.id, val || 0, 'QUANTITY', opt.groupCode)}
                        size="small"
                        className="w-20"
                      />
                    )}
                    <div>
                      <div className="font-medium text-sm">{opt.name}</div>
                      {opt.description && <div className="text-xs text-gray-400">{opt.description}</div>}
                      {opt.adjustmentRoundDelta > 0 && (
                        <Tag color="purple" className="mt-1 text-xs">+{opt.adjustmentRoundDelta} lượt sửa</Tag>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-sm text-indigo-600">{formatVnd(opt.defaultPrice)}</span>
                    {opt.selectionType === 'QUANTITY' && <div className="text-xs text-gray-400">/đơn vị</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {/* Tổng */}
      <div className="bg-gray-50 rounded-xl p-4 border">
        <div className="flex justify-between items-center">
          <Text strong>Tổng phí dịch vụ:</Text>
          <span className="text-xl font-bold text-indigo-600">{formatVnd(totalPrice)}</span>
        </div>
        {totalAdjustmentRounds > 0 && (
          <div className="flex justify-between items-center mt-2">
            <Text type="secondary">Số lượt hiệu chỉnh:</Text>
            <Tag color="purple">{totalAdjustmentRounds} lượt</Tag>
          </div>
        )}
      </div>
    </div>
  );
}
