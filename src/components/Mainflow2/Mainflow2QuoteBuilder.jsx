import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, InputNumber, Radio, Select, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import materialApi from '../../api/materialApi';
import { uploadFile } from '../../api/mainflow2Api';

const { Text } = Typography;

const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

/**
 * Form báo giá kỹ thuật (TechnicalDraft).
 *
 * Mỗi sản phẩm chỉ có duy nhất 1 chất liệu — không có thành phần, không có tiền công.
 * Trường hợp staff muốn tùy chỉnh đơn giá (unitPrice), có thể nhập trực tiếp
 * hoặc để trống để BE tự tính = weight × serviceCost × (1 + markup%).
 *
 * Props:
 *   onSubmit(payload)  — gọi khi staff bấm Gửi báo giá
 *   submitting         — loading state
 *   onCancel           — đóng modal
 *   designVersionHistoryId — (optional) gắn báo giá vào version cụ thể
 */
const Mainflow2QuoteBuilder = ({ onSubmit, submitting, onCancel, designVersionHistoryId }) => {
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Form fields — match BE CreateTechnicalDraftCommand
  const [materialId, setMaterialId] = useState(null);
  const [weight, setWeight] = useState(50);             // EstimatedWeightPerUnit (g)
  const [infill, setInfill] = useState(20);              // InfillDensity (0-100)
  const [layerHeight, setLayerHeight] = useState(0.2);   // LayerHeight (mm)
  const [printTime, setPrintTime] = useState(null);       // EstimatedPrintTimePerUnit (min)
  const [markup, setMarkup] = useState(10);               // MarkupPercentage (%)
  const [unitPriceOverride, setUnitPriceOverride] = useState(null); // UnitPrice (null = auto)
  const [note, setNote] = useState('');                   // TechnicalNote
  const [previewSource, setPreviewSource] = useState('version'); // 'version' | 'upload'
  const [previewModelUrl, setPreviewModelUrl] = useState(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingMaterials(true);
        const res = await materialApi.getAll();
        const list = (res?.data || res || []).filter((m) => m.isActive !== false);
        setMaterials(list);
      } catch (e) {
        console.error('Load materials failed', e);
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

  const selectedMaterial = materialsById[materialId];

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} — ${Number(m.totalServiceCostPerGram || 0).toLocaleString('vi-VN')} đ/g`,
  }));

  // Price preview — mirrors BE PricingEngine logic
  const pricePreview = useMemo(() => {
    if (!selectedMaterial || !weight) return null;
    const costPerGram = Number(selectedMaterial.totalServiceCostPerGram || 0);
    const baseCostPerGram = Number(selectedMaterial.baseCostPerGram || selectedMaterial.baseCost || 0);
    const materialCost = Math.round(weight * costPerGram);
    const effectiveUnitPrice = unitPriceOverride != null ? unitPriceOverride : materialCost;
    const finalPrice = Math.round(effectiveUnitPrice * (1 + (markup || 0) / 100));
    return { costPerGram, baseCostPerGram, materialCost, effectiveUnitPrice, finalPrice };
  }, [selectedMaterial, weight, markup, unitPriceOverride]);

  const handleSubmit = () => {
    if (!materialId) {
      message.warning('Vui lòng chọn vật liệu.');
      return;
    }
    if (!weight || weight <= 0) {
      message.warning('Khối lượng phải lớn hơn 0.');
      return;
    }
    if (layerHeight <= 0) {
      message.warning('Độ dày lớp in phải lớn hơn 0.');
      return;
    }

    const payload = {
      materialId,
      estimatedWeightPerUnit: weight,
      infillDensity: infill,
      layerHeight,
      estimatedPrintTimePerUnit: printTime || null,
      unitPrice: unitPriceOverride,
      markupPercentage: markup,
      technicalNote: note.trim(),
      previewModelUrl: previewSource === 'upload' ? previewModelUrl : null,
    };

    // Gắn version nếu có
    if (designVersionHistoryId) {
      payload.designVersionHistoryId = designVersionHistoryId;
    }

    onSubmit?.(payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Chọn <strong>vật liệu</strong>, nhập <strong>thông số in</strong> và BE sẽ tự tính giá.
        Bạn có thể ghi đè đơn giá nếu cần.
      </Text>

      {/* Material selector */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
          Vật liệu <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <Select
          showSearch
          placeholder="Chọn vật liệu in"
          loading={loadingMaterials}
          options={materialOptions}
          value={materialId}
          onChange={setMaterialId}
          style={{ width: '100%' }}
          optionFilterProp="label"
          size="large"
        />
        {selectedMaterial && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280', display: 'flex', gap: 12 }}>
            <span>Giá cơ bản: {Number(selectedMaterial.baseCostPerGram || selectedMaterial.baseCost || 0).toLocaleString('vi-VN')} đ/g</span>
            <span>Giá dịch vụ: {Number(selectedMaterial.totalServiceCostPerGram || 0).toLocaleString('vi-VN')} đ/g</span>
          </div>
        )}
      </div>

      {/* Specs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
            Khối lượng / sản phẩm <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <InputNumber
            min={0.1}
            step={1}
            value={weight}
            onChange={setWeight}
            addonAfter="g"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
            Mật độ in (infill)
          </label>
          <InputNumber
            min={0}
            max={100}
            step={5}
            value={infill}
            onChange={setInfill}
            addonAfter="%"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
            Độ dày lớp in
          </label>
          <InputNumber
            min={0.01}
            step={0.05}
            value={layerHeight}
            onChange={setLayerHeight}
            addonAfter="mm"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
            Thời gian in ước tính
          </label>
          <InputNumber
            min={0}
            step={10}
            value={printTime}
            onChange={setPrintTime}
            addonAfter="phút"
            placeholder="Tùy chọn"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Pricing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
            Đơn giá (để trống = tự tính)
          </label>
          <InputNumber
            min={0}
            step={1000}
            value={unitPriceOverride}
            onChange={setUnitPriceOverride}
            placeholder="Tự tính từ vật liệu"
            formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
            parser={(v) => v?.replace(/\$\s?|(,*)/g, '')}
            addonAfter="đ"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
            Markup (phụ thu)
          </label>
          <InputNumber
            min={0}
            max={200}
            step={5}
            value={markup}
            onChange={setMarkup}
            addonAfter="%"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Price preview */}
      {pricePreview && (
        <div style={{ padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
            <span>Chi phí vật liệu ({weight}g × {pricePreview.costPerGram.toLocaleString('vi-VN')} đ/g)</span>
            <span>{formatVnd(pricePreview.materialCost)}</span>
          </div>
          {unitPriceOverride != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#d97706', marginTop: 4 }}>
              <span>Đơn giá ghi đè</span>
              <span>{formatVnd(unitPriceOverride)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            <span>Markup +{markup}%</span>
            <span>×{(1 + markup / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: '#065f46', marginTop: 8, paddingTop: 8, borderTop: '1px solid #6ee7b7' }}>
            <span>Giá cuối</span>
            <span>{formatVnd(pricePreview.finalPrice)}</span>
          </div>
        </div>
      )}

      {/* Preview model source */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
          File preview 3D
        </label>
        <Radio.Group value={previewSource} onChange={(e) => { setPreviewSource(e.target.value); if (e.target.value === 'version') setPreviewModelUrl(null); }}>
          <Radio value="version">Dùng mẫu từ phiên bản thiết kế</Radio>
          <Radio value="upload">Tải lên file preview riêng</Radio>
        </Radio.Group>
        {previewSource === 'upload' && (
          <div style={{ marginTop: 8 }}>
            {previewModelUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#059669' }}>
                <span>✓ Đã tải lên</span>
                <Button size="small" danger onClick={() => setPreviewModelUrl(null)}>Xóa</Button>
              </div>
            ) : (
              <Upload
                accept=".glb,.stl,.obj,.gltf"
                maxCount={1}
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    setUploadingPreview(true);
                    const res = await uploadFile(file);
                    const url = res?.data?.url || res?.data?.fileUrl || res?.url || res?.fileUrl;
                    if (url) {
                      setPreviewModelUrl(url);
                      onSuccess?.();
                      message.success('Upload thành công');
                    } else {
                      throw new Error('Không nhận được URL');
                    }
                  } catch (e) {
                    onError?.(e);
                    message.error('Upload thất bại');
                  } finally {
                    setUploadingPreview(false);
                  }
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadingPreview} size="small">
                  Chọn file .glb / .stl
                </Button>
              </Upload>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
          Ghi chú kỹ thuật
        </label>
        <Input.TextArea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Cam kết, thời gian hoàn thành, lưu ý in..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {onCancel && <Button onClick={onCancel}>Hủy</Button>}
        <Button
          type="primary"
          loading={submitting}
          style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}
          onClick={handleSubmit}
        >
          Gửi báo giá {pricePreview ? formatVnd(pricePreview.finalPrice) : ''}
        </Button>
      </div>
    </div>
  );
};

export default Mainflow2QuoteBuilder;
