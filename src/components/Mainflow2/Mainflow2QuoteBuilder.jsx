import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, InputNumber, Select, Table, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import materialApi from '../../api/materialApi';

const { Text } = Typography;

const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

const newMaterialRow = () => ({ key: crypto.randomUUID(), materialId: null, grams: 50 });

const newComponent = (index = 0) => ({
  key: crypto.randomUUID(),
  name: `Thành phần ${index + 1}`,
  quantity: 1,
  materials: [newMaterialRow()],
});

const calcPreview = (components, materialsById, laborCost) => {
  let materialSubtotal = 0;
  const lines = [];

  components.forEach((comp) => {
    const qty = Math.max(1, Number(comp.quantity) || 1);
    let compTotal = 0;
    (comp.materials || []).forEach((row) => {
      const mat = materialsById[row.materialId];
      if (!mat || !row.grams) return;
      const pricePerGram = Number(mat.totalServiceCostPerGram) || 0;
      const totalGrams = Number(row.grams) * qty;
      const lineTotal = Math.round(totalGrams * pricePerGram);
      compTotal += lineTotal;
      lines.push({
        component: comp.name,
        material: mat.name,
        grams: row.grams,
        qty,
        totalGrams,
        lineTotal,
      });
    });
    materialSubtotal += compTotal;
  });

  const labor = Math.max(0, Number(laborCost) || 0);
  return { lines, materialSubtotal, labor, total: materialSubtotal + labor };
};

/**
 * Form báo giá chi tiết Mainflow2: thành phần → vật liệu → gram → tiền công.
 */
const Mainflow2QuoteBuilder = ({ onSubmit, submitting, onCancel }) => {
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [components, setComponents] = useState([newComponent(0)]);
  const [laborCost, setLaborCost] = useState(0);
  const [staffNote, setStaffNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoadingMaterials(true);
        const res = await materialApi.getAll();
        const list = (res?.data || res || []).filter((m) => m.isActive !== false);
        setMaterials(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMaterials(false);
      }
    })();
  }, []);

  const materialsById = useMemo(() => {
    const map = {};
    materials.forEach((m) => { map[m.id] = m; });
    return map;
  }, [materials]);

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} (${Number(m.totalServiceCostPerGram || 0).toLocaleString('vi-VN')} đ/g)`,
  }));

  const preview = useMemo(
    () => calcPreview(components, materialsById, laborCost),
    [components, materialsById, laborCost],
  );

  const updateComponent = (key, patch) => {
    setComponents((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const addComponent = () => setComponents((list) => [...list, newComponent(list.length)]);

  const removeComponent = (key) => {
    setComponents((list) => (list.length <= 1 ? list : list.filter((c) => c.key !== key)));
  };

  const updateMaterialRow = (compKey, rowKey, patch) => {
    setComponents((list) =>
      list.map((c) => {
        if (c.key !== compKey) return c;
        return {
          ...c,
          materials: c.materials.map((r) => (r.key === rowKey ? { ...r, ...patch } : r)),
        };
      }),
    );
  };

  const addMaterialRow = (compKey) => {
    setComponents((list) =>
      list.map((c) =>
        c.key === compKey ? { ...c, materials: [...c.materials, newMaterialRow()] } : c,
      ),
    );
  };

  const removeMaterialRow = (compKey, rowKey) => {
    setComponents((list) =>
      list.map((c) => {
        if (c.key !== compKey) return c;
        const mats = c.materials.filter((r) => r.key !== rowKey);
        return { ...c, materials: mats.length ? mats : [newMaterialRow()] };
      }),
    );
  };

  const buildPayload = () => ({
    quotedPrice: preview.total,
    currency: 'VND',
    laborCost: Number(laborCost) || 0,
    staffNote: staffNote.trim(),
    components: components.map((c) => ({
      name: c.name.trim() || 'Thành phần',
      quantity: Math.max(1, Number(c.quantity) || 1),
      materials: (c.materials || [])
        .filter((r) => r.materialId && r.grams > 0)
        .map((r) => ({ materialId: r.materialId, grams: Number(r.grams) })),
    })),
  });

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload.components.length || payload.components.some((c) => !c.materials.length)) {
      return { error: 'Mỗi thành phần cần ít nhất một vật liệu và định lượng (gram).' };
    }
    if (preview.total <= 0) {
      return { error: 'Tổng báo giá phải lớn hơn 0.' };
    }
    if (!staffNote.trim()) {
      return { error: 'Vui lòng nhập ghi chú báo giá.' };
    }
    onSubmit?.(payload);
    return {};
  };

  const previewColumns = [
    { title: 'Thành phần', dataIndex: 'component', key: 'component' },
    { title: 'Vật liệu', dataIndex: 'material', key: 'material' },
    {
      title: 'Định lượng',
      key: 'grams',
      render: (_, r) => `${r.grams} g/sp × ${r.qty} = ${r.totalGrams} g`,
    },
    {
      title: 'Tiền',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right',
      render: (v) => formatVnd(v),
    },
  ];

  return (
    <div className="space-y-4">
      <Text type="secondary" className="text-xs block">
        Một sản phẩm gồm nhiều <strong>thành phần</strong>. Mỗi thành phần chọn một hoặc nhiều{' '}
        <strong>vật liệu</strong> kèm <strong>định lượng (gram/sp)</strong>, sau đó cộng{' '}
        <strong>tiền công</strong> để ra báo giá chi tiết.
      </Text>

      {components.map((comp, ci) => (
        <div
          key={comp.key}
          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <Input
              value={comp.name}
              onChange={(e) => updateComponent(comp.key, { name: e.target.value })}
              placeholder="Tên thành phần (vd: Thân, Đế, Phụ kiện...)"
              style={{ flex: 1, minWidth: 160, fontWeight: 600 }}
            />
            <div className="flex items-center gap-2">
              <Text className="text-xs">SL:</Text>
              <InputNumber
                min={1}
                value={comp.quantity}
                onChange={(v) => updateComponent(comp.key, { quantity: v })}
                style={{ width: 72 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={components.length <= 1}
                onClick={() => removeComponent(comp.key)}
              />
            </div>
          </div>

          {(comp.materials || []).map((row) => (
            <div key={row.key} className="flex flex-wrap gap-2 items-center pl-2 border-l-2 border-indigo-200">
              <Select
                showSearch
                placeholder="Chất liệu"
                loading={loadingMaterials}
                options={materialOptions}
                value={row.materialId}
                onChange={(v) => updateMaterialRow(comp.key, row.key, { materialId: v })}
                style={{ minWidth: 200, flex: 1 }}
                optionFilterProp="label"
              />
              <InputNumber
                min={0.1}
                step={1}
                value={row.grams}
                onChange={(v) => updateMaterialRow(comp.key, row.key, { grams: v })}
                addonAfter="g/sp"
                style={{ width: 130 }}
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeMaterialRow(comp.key, row.key)}
              />
            </div>
          ))}
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addMaterialRow(comp.key)}>
            Thêm vật liệu cho {comp.name || `thành phần ${ci + 1}`}
          </Button>
        </div>
      ))}

      <Button type="dashed" block icon={<PlusOutlined />} onClick={addComponent}>
        Thêm thành phần
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Tiền công / gia công (VND)</label>
          <InputNumber
            className="w-full"
            min={0}
            step={10000}
            value={laborCost}
            onChange={setLaborCost}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(v) => v?.replace(/\$\s?|(,*)/g, '')}
          />
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Vật liệu</span>
            <span>{formatVnd(preview.materialSubtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600 mt-1">
            <span>Tiền công</span>
            <span>{formatVnd(preview.labor)}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-800 text-base mt-2 pt-2 border-t border-emerald-200">
            <span>Tổng báo giá</span>
            <span>{formatVnd(preview.total)}</span>
          </div>
        </div>
      </div>

      {preview.lines.length > 0 && (
        <Table
          size="small"
          pagination={false}
          columns={previewColumns}
          dataSource={preview.lines.map((l, i) => ({ ...l, key: i }))}
        />
      )}

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Ghi chú gửi khách</label>
        <Input.TextArea
          rows={2}
          value={staffNote}
          onChange={(e) => setStaffNote(e.target.value)}
          placeholder="Cam kết, thời gian hoàn thành, lưu ý in..."
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && <Button onClick={onCancel}>Hủy</Button>}
        <Button
          type="primary"
          loading={submitting}
          style={{ background: '#059669', borderColor: '#059669' }}
          onClick={() => {
            const { error: err } = handleSubmit();
            if (err) message.warning(err);
          }}
        >
          Gửi báo giá {formatVnd(preview.total)}
        </Button>
      </div>
    </div>
  );
};

export default Mainflow2QuoteBuilder;
