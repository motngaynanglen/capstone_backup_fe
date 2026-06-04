import React, { useEffect, useState } from 'react';
import { Select, Spin } from 'antd';
import { getGhnProvincesApi, getGhnDistrictsApi, getGhnWardsApi } from '../../api/ghnApi';

/**
 * Chọn Tỉnh → Quận → Phường theo master data GHN (mã district_id + ward_code).
 */
const GhnLocationPicker = ({ value, onChange, disabled = false }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState(null);

  const v = value || {};

  useEffect(() => {
    (async () => {
      try {
        setLoadingProvinces(true);
        setError(null);
        const res = await getGhnProvincesApi();
        setProvinces(res?.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Không tải tỉnh/thành GHN');
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!v.provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    (async () => {
      try {
        setLoadingDistricts(true);
        const res = await getGhnDistrictsApi(v.provinceId);
        setDistricts(res?.data || []);
      } catch {
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    })();
  }, [v.provinceId]);

  useEffect(() => {
    if (!v.districtId) {
      setWards([]);
      return;
    }
    (async () => {
      try {
        setLoadingWards(true);
        const res = await getGhnWardsApi(v.districtId);
        setWards(res?.data || []);
      } catch {
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    })();
  }, [v.districtId]);

  const emit = (patch) => {
    const next = { ...v, ...patch };
    onChange?.({
      provinceId: next.provinceId,
      provinceName: next.provinceName || '',
      districtId: next.districtId,
      districtName: next.districtName || '',
      wardCode: next.wardCode || '',
      wardName: next.wardName || '',
    });
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Tỉnh / Thành phố (GHN) *</label>
        <Select
          showSearch
          disabled={disabled || loadingProvinces}
          placeholder={loadingProvinces ? 'Đang tải…' : 'Chọn tỉnh/thành'}
          className="w-full"
          value={v.provinceId || undefined}
          optionFilterProp="label"
          notFoundContent={loadingProvinces ? <Spin size="small" /> : null}
          options={provinces.map((p) => ({
            value: p.provinceId,
            label: p.provinceName,
          }))}
          onChange={(id, opt) => {
            emit({
              provinceId: id,
              provinceName: opt?.label || '',
              districtId: undefined,
              districtName: '',
              wardCode: '',
              wardName: '',
            });
          }}
        />
      </div>
      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Quận / Huyện (GHN) *</label>
        <Select
          showSearch
          disabled={disabled || !v.provinceId || loadingDistricts}
          placeholder={!v.provinceId ? 'Chọn tỉnh trước' : 'Chọn quận/huyện'}
          className="w-full"
          value={v.districtId || undefined}
          optionFilterProp="label"
          options={districts.map((d) => ({
            value: d.districtId,
            label: d.districtName,
          }))}
          onChange={(id, opt) => {
            emit({
              districtId: id,
              districtName: opt?.label || '',
              wardCode: '',
              wardName: '',
            });
          }}
        />
      </div>
      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Phường / Xã (GHN) *</label>
        <Select
          showSearch
          disabled={disabled || !v.districtId || loadingWards}
          placeholder={!v.districtId ? 'Chọn quận trước' : 'Chọn phường/xã'}
          className="w-full"
          value={v.wardCode || undefined}
          optionFilterProp="label"
          options={wards.map((w) => ({
            value: w.wardCode,
            label: w.wardName,
          }))}
          onChange={(code, opt) => {
            emit({
              wardCode: code,
              wardName: opt?.label || '',
            });
          }}
        />
      </div>
      {v.districtId && v.wardCode && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          ✓ Địa chỉ GHN hợp lệ — phí ship sẽ được tính ngay bên dưới.
        </p>
      )}
    </div>
  );
};

export default GhnLocationPicker;
