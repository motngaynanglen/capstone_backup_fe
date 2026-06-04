import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Switch,
  Image,
  Tooltip,
  Alert,
  Statistic,
  Typography,
  Collapse,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownOutlined,
  ShopOutlined,
  FileOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import ProductFileUpload from '../../components/Manager/ProductFileUpload';
import QuickAddVariantForm from '../../components/Manager/QuickAddVariantForm';
import { useSearchParams } from 'react-router-dom';
import designVariantApi from '../../api/designVariantApi';
import materialApi from '../../api/materialApi';
import designTemplateApi from '../../api/designTemplateApi';
import conceptTagApi from '../../api/conceptTagApi';
import { getTemplateMedia, getVariantMediaDisplay, fileLabel } from '../../utils/variantMedia';
import './ManageProducts.css';

const { Option } = Select;
const { Text, Paragraph } = Typography;

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const formatVnd = (n) => Number(n || 0).toLocaleString('vi-VN');

const ManageProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [conceptTags, setConceptTags] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm] = Form.useForm();
  const fileUrlWatch = Form.useWatch('fileUrl', templateForm);
  const thumbUrlWatch = Form.useWatch('thumbnailUrl', templateForm);

  const [variantDrawerOpen, setVariantDrawerOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantContextTemplate, setVariantContextTemplate] = useState(null);
  const [variantForm] = Form.useForm();
  const quickFormsRef = useRef({});

  const materialNameById = useMemo(
    () => Object.fromEntries(materials.map((m) => [String(m.id), m.name])),
    [materials]
  );

  const stats = useMemo(() => {
    const templates = catalog.length;
    const variants = catalog.reduce((s, t) => s + (t.variantCount || 0), 0);
    const onShop = catalog.reduce((s, t) => s + (t.activeVariantCount || 0), 0);
    const needsVariants = catalog.filter((t) => (t.activeVariantCount || 0) === 0).length;
    return { templates, variants, onShop, needsVariants };
  }, [catalog]);

  const fetchCatalog = useCallback(
    async (page = 1, search = searchText, tagId = tagFilter) => {
      setTableLoading(true);
      try {
        const res = await designTemplateApi.manageCatalog({
          pageNumber: page,
          pageSize: pagination.pageSize,
          search: search || '',
          includeInactive,
          conceptTagId: tagId || undefined,
        });
        const list = unwrapList(res);
        setCatalog(list);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: res?.additionalData?.pagination?.totalCount ?? list.length,
        }));
      } catch (err) {
        console.error(err);
        message.error('Không tải được danh sách sản phẩm');
        setCatalog([]);
      } finally {
        setTableLoading(false);
      }
    },
    [searchText, tagFilter, includeInactive, pagination.pageSize]
  );

  const fetchLookups = useCallback(async () => {
    try {
      const [matRes, tagRes] = await Promise.all([materialApi.getAll(), conceptTagApi.getAll()]);
      setMaterials(unwrapList(matRes));
      setConceptTags(unwrapList(tagRes));
    } catch {
      message.warning('Không tải đủ bộ lọc');
    }
  }, []);

  useEffect(() => {
    fetchLookups();
    fetchCatalog(1);
  }, []);

  useEffect(() => {
    fetchCatalog(1);
  }, [includeInactive]);

  useEffect(() => {
    const editId = searchParams.get('editTemplate');
    if (!editId || catalog.length === 0) return;
    const row = catalog.find((t) => String(t.id) === editId);
    if (row) {
      openTemplateDrawer(row);
      setExpandedKeys((keys) => (keys.includes(row.id) ? keys : [...keys, row.id]));
      searchParams.delete('editTemplate');
      setSearchParams(searchParams, { replace: true });
    }
  }, [catalog, searchParams]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openTemplateDrawer(null);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const refresh = (page = pagination.current) => fetchCatalog(page);

  const openTemplateDrawer = (template) => {
    setEditingTemplate(template);
    if (template) {
      templateForm.setFieldsValue({
        code: template.code,
        name: template.name,
        description: template.description,
        fileUrl: template.fileUrl,
        thumbnailUrl: template.thumbnailUrl,
      });
    } else {
      templateForm.resetFields();
    }
    setTemplateDrawerOpen(true);
  };

  const closeTemplateDrawer = () => {
    setTemplateDrawerOpen(false);
    setEditingTemplate(null);
  };

  const saveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      if (!values.fileUrl?.trim()) {
        message.warning('Vui lòng upload file 3D (GLB, STL hoặc OBJ).');
        return;
      }
      setSubmitting(true);
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description || '',
        fileUrl: values.fileUrl.trim(),
        thumbnailUrl: values.thumbnailUrl?.trim() || '',
      };
      if (editingTemplate) {
        await designTemplateApi.update(editingTemplate.id, payload);
        message.success('Đã cập nhật mẫu — mọi biến thể dùng chung file & ảnh (trừ khi override)');
      } else {
        const created = await designTemplateApi.add(payload);
        const newId = created?.data?.id;
        message.success('Đã tạo mẫu. Thêm biến thể bên dưới (chỉ cần giá, vật liệu, tồn).');
        if (newId) {
          setExpandedKeys((k) => [...k, newId]);
        }
      }
      closeTemplateDrawer();
      refresh(1);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu mẫu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await designTemplateApi.delete(id);
      message.success('Đã xóa mẫu');
      refresh();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const openVariantDrawer = (template, variant = null) => {
    setVariantContextTemplate(template);
    setEditingVariant(variant);
    variantForm.resetFields();
    if (variant) {
      variantForm.setFieldsValue({
        code: variant.code,
        name: variant.name,
        materialId: variant.materialId,
        price: variant.price,
        stockQuantity: variant.stockQuantity,
        sizeScale: variant.sizeScale ?? 1,
        isAllowPreOrder: variant.isAllowPreOrder !== false,
        previewModelUrl: variant.previewModelUrl || '',
        useTemplateMedia: !variant.previewModelUrl,
      });
    } else {
      variantForm.setFieldsValue({
        sizeScale: 1,
        stockQuantity: 0,
        isAllowPreOrder: true,
        useTemplateMedia: true,
        previewModelUrl: '',
      });
    }
    setVariantDrawerOpen(true);
  };

  const closeVariantDrawer = () => {
    setVariantDrawerOpen(false);
    setEditingVariant(null);
    setVariantContextTemplate(null);
  };

  const buildVariantPayload = (values, designTemplateId) => {
    const payload = {
      designTemplateId,
      materialId: values.materialId,
      code: values.code,
      name: values.name,
      sizeScale: values.sizeScale ?? 1,
      stockQuantity: values.stockQuantity ?? 0,
      price: values.price ?? 0,
      isAllowPreOrder: values.isAllowPreOrder !== false,
      estimatedWeightPerUnit: values.estimatedWeightPerUnit ?? 0,
      estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit ?? 0,
    };
    if (!values.useTemplateMedia && values.previewModelUrl?.trim()) {
      payload.previewModelUrl = values.previewModelUrl.trim();
    }
    return payload;
  };

  const saveVariant = async () => {
    try {
      const values = await variantForm.validateFields();
      setSubmitting(true);
      if (editingVariant) {
        const updatePayload = {
          id: editingVariant.id,
          materialId: values.materialId,
          code: values.code,
          name: values.name,
          sizeScale: values.sizeScale ?? 1,
          stockQuantity: values.stockQuantity ?? 0,
          price: values.price ?? 0,
          isAllowPreOrder: values.isAllowPreOrder !== false,
          estimatedWeightPerUnit: values.estimatedWeightPerUnit ?? 0,
          estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit ?? 0,
        };
        if (values.useTemplateMedia) {
          updatePayload.clearPreviewOverride = true;
        } else if (values.previewModelUrl?.trim()) {
          updatePayload.previewModelUrl = values.previewModelUrl.trim();
        }
        await designVariantApi.update(updatePayload);
        message.success('Đã cập nhật biến thể');
      } else {
        await designVariantApi.add(buildVariantPayload(values, variantContextTemplate.id));
        message.success('Biến thể đã lên cửa hàng (dùng file ảnh từ mẫu)');
      }
      closeVariantDrawer();
      refresh();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu biến thể thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const registerQuickForm = useCallback((templateId, form) => {
    quickFormsRef.current[templateId] = form;
  }, []);

  const saveQuickVariant = useCallback(
    async (template, form) => {
      const activeForm = form || quickFormsRef.current[template.id];
      if (!activeForm) return;
      try {
        const values = await activeForm.validateFields();
        setSubmitting(true);
        await designVariantApi.add(buildVariantPayload({ ...values, useTemplateMedia: true }, template.id));
        message.success('Đã thêm biến thể');
        activeForm.resetFields();
        activeForm.setFieldsValue({ sizeScale: 1, stockQuantity: 0, isAllowPreOrder: true });
        refresh();
      } catch (err) {
        if (err?.errorFields) return;
        message.error(err?.response?.data?.message || 'Thêm biến thể thất bại');
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const deleteVariant = async (variantId) => {
    try {
      await designVariantApi.delete(variantId);
      message.success('Đã xóa biến thể');
      refresh();
    } catch {
      message.error('Xóa thất bại');
    }
  };

  const expandAndAdd = (row) => {
    setExpandedKeys((k) => (k.includes(row.id) ? k : [...k, row.id]));
  };

  const renderVariantCard = (template, variant) => {
    const media = getVariantMediaDisplay(variant, template);
    const matName = materialNameById[String(variant.materialId)];
    const live = variant.isActive;

    return (
      <div
        key={variant.id}
        className={`product-mgmt__variant-card ${live ? 'product-mgmt__variant-card--live' : 'product-mgmt__variant-card--draft'}`}
      >
        <div className="flex gap-3">
          <img
            src={media.thumb || '/placeholder.png'}
            alt=""
            className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Text strong className="block truncate">
                  {variant.name}
                </Text>
                <Text type="secondary" className="font-mono text-xs">
                  {variant.code}
                </Text>
              </div>
              {live ? (
                <Tag color="success" className="m-0 shrink-0">
                  <ShopOutlined /> Live
                </Tag>
              ) : (
                <Tag className="m-0">Ẩn</Tag>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Tag>{matName || 'Vật liệu'}</Tag>
              <Tag color="red">{formatVnd(variant.price)} đ</Tag>
              <Tag color={variant.stockQuantity > 0 ? 'green' : 'orange'}>
                Tồn {variant.stockQuantity}
              </Tag>
            </div>
            <Tooltip title={media.model || 'Kế thừa mẫu'}>
              <span className="product-mgmt__file-pill mt-2">
                <FileOutlined />
                {media.hasOverride ? 'File riêng' : 'File mẫu'}
                {media.model ? ` · ${fileLabel(media.model)}` : ''}
              </span>
            </Tooltip>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-1">
          <Button size="small" icon={<EditOutlined />} onClick={() => openVariantDrawer(template, variant)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa biến thể?" onConfirm={() => deleteVariant(variant.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>
    );
  };

  const expandedRowRender = useCallback(
    (template) => {
    const tplMedia = getTemplateMedia(template);
    const variants = template.variants || [];

    return (
      <div className="product-mgmt__expand" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg bg-white border border-slate-200">
          <PictureOutlined className="text-indigo-500 text-lg" />
          <div className="flex-1 min-w-0">
            <Text type="secondary" className="text-xs block">
              Media dùng chung cho mọi biến thể
            </Text>
            <Text className="text-sm">
              File 3D: <Text code>{fileLabel(tplMedia.fileUrl || template.fileUrl)}</Text>
              {tplMedia.thumbnail && (
                <>
                  {' '}
                  · Thumbnail: <Text code>{fileLabel(tplMedia.thumbnail)}</Text>
                </>
              )}
            </Text>
          </div>
          <Button size="small" onClick={() => openTemplateDrawer(template)}>
            Sửa file mẫu
          </Button>
        </div>

        {variants.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có biến thể — khách chưa thấy trên cửa hàng"
            className="mb-4"
          />
        ) : (
          <div className="product-mgmt__variant-grid">
            {variants.map((v) => renderVariantCard(template, v))}
          </div>
        )}

        <QuickAddVariantForm
          template={template}
          materials={materials}
          submitting={submitting}
          onRegisterForm={registerQuickForm}
          onSubmit={saveQuickVariant}
        />
      </div>
    );
    },
    [materials, submitting, registerQuickForm, saveQuickVariant]
  );

  const columns = [
    {
      title: 'Mẫu thiết kế',
      key: 'template',
      render: (_, row) => {
        const thumb = getTemplateMedia(row).thumbnail;
        return (
          <div className="product-mgmt__template-cell">
            <img
              src={thumb || undefined}
              alt=""
              className="product-mgmt__thumb"
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%23e2e8f0' width='56' height='56'/%3E%3C/svg%3E";
              }}
            />
            <div className="min-w-0">
              <div className="product-mgmt__template-title">{row.name}</div>
              <div className="product-mgmt__template-code">{row.code}</div>
              <span className="product-mgmt__file-pill">
                <FileOutlined /> {fileLabel(row.fileUrl)}
              </span>
              {(row.conceptTagNames || []).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {row.conceptTagNames.map((n) => (
                    <Tag key={n} className="text-[10px] m-0 leading-tight">
                      {n}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Cửa hàng',
      key: 'shop',
      width: 130,
      render: (_, row) => {
        const active = row.activeVariantCount || 0;
        if (active === 0) {
          return (
            <Tag icon={<WarningOutlined />} color="warning">
              Chưa bán
            </Tag>
          );
        }
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {active} live
          </Tag>
        );
      },
    },
    {
      title: 'Biến thể',
      key: 'variants',
      width: 90,
      align: 'center',
      render: (_, row) => <Statistic value={row.variantCount || 0} valueStyle={{ fontSize: 18 }} />,
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, row) => (
        <Space>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => expandAndAdd(row)}>
            Biến thể
          </Button>
          <Tooltip title="Sửa mẫu (file 3D, ảnh)">
            <Button size="small" icon={<EditOutlined />} onClick={() => openTemplateDrawer(row)} />
          </Tooltip>
          <Popconfirm title="Xóa mẫu?" onConfirm={() => deleteTemplate(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const variantInheritPanel = variantContextTemplate && (
    <div className="product-mgmt__drawer-inherit">
      <Text strong className="text-indigo-900">
        File 3D & ảnh kế thừa từ mẫu
      </Text>
      <Paragraph type="secondary" className="!mb-0 text-sm">
        Biến thể không cần upload lại. Chỉnh <strong>giá, vật liệu, tồn kho</strong> tại đây; muốn file khác
        mới bật override bên dưới.
      </Paragraph>
      <div className="product-mgmt__drawer-inherit-preview">
        <img
          src={getTemplateMedia(variantContextTemplate).thumbnail || undefined}
          alt=""
          onError={(e) => {
            e.target.style.visibility = 'hidden';
          }}
        />
        <div className="text-xs text-slate-600 min-w-0">
          <div>
            <FileOutlined /> {fileLabel(variantContextTemplate.fileUrl)}
          </div>
          <div className="mt-1 text-slate-400">{variantContextTemplate.name}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="product-mgmt p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="product-mgmt__hero">
          <h1>Catalog sản phẩm</h1>
          <p>
            Upload <strong>một lần</strong> file 3D và ảnh trên mẫu thiết kế. Mỗi biến thể chỉ cần chất liệu,
            giá và tồn — tự dùng media của mẫu.
          </p>
          <div className="product-mgmt__stats">
            <div className="product-mgmt__stat">
              <div className="product-mgmt__stat-value">{stats.templates}</div>
              <div className="product-mgmt__stat-label">Mẫu thiết kế</div>
            </div>
            <div className="product-mgmt__stat">
              <div className="product-mgmt__stat-value">{stats.variants}</div>
              <div className="product-mgmt__stat-label">Biến thể tổng</div>
            </div>
            <div className="product-mgmt__stat">
              <div className="product-mgmt__stat-value">{stats.onShop}</div>
              <div className="product-mgmt__stat-label">Đang hiển thị cửa hàng</div>
            </div>
            <div className="product-mgmt__stat">
              <div className="product-mgmt__stat-value">{stats.needsVariants}</div>
              <div className="product-mgmt__stat-label">Mẫu chưa có SKU bán</div>
            </div>
          </div>
        </header>

        <div className="product-mgmt__inherit-banner">
          <InboxOutlined className="text-indigo-600 text-lg mt-0.5" />
          <div>
            <strong>Không cần upload file cho từng biến thể.</strong> Kéo thả GLB/STL và ảnh vào mẫu một lần.
            Biến thể chỉ nhập giá &amp; vật liệu. Chỉ bật &quot;File 3D riêng&quot; khi phiên bản in dùng mesh khác.
          </div>
        </div>

        <div className="product-mgmt__toolbar">
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={11}>
              <Input.Search
                placeholder="Tìm mẫu theo tên, mã..."
                allowClear
                size="large"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(v) => fetchCatalog(1, v, tagFilter)}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                className="w-full"
                size="large"
                placeholder="Danh mục"
                allowClear
                value={tagFilter}
                onChange={(v) => {
                  setTagFilter(v);
                  fetchCatalog(1, searchText, v);
                }}
              >
                {conceptTags.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={5}>
              <label className="flex items-center justify-end gap-2 text-sm text-slate-600 h-full">
                <Switch checked={includeInactive} onChange={setIncludeInactive} />
                Mẫu đã tắt
              </label>
            </Col>
          </Row>
        </div>

        <div className="product-mgmt__table-wrap">
          <Table
            rowKey="id"
            loading={tableLoading}
            columns={columns}
            dataSource={catalog}
            expandable={{
              expandedRowRender,
              expandedRowKeys: expandedKeys,
              onExpandedRowsChange: setExpandedKeys,
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  size="small"
                  icon={<DownOutlined style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
                  onClick={(e) => onExpand(record, e)}
                />
              ),
            }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              onChange: (page, size) => {
                setPagination((p) => ({ ...p, pageSize: size }));
                fetchCatalog(page, searchText, tagFilter);
              },
            }}
          />
        </div>

        <Drawer
          title={editingTemplate ? 'Chỉnh sửa mẫu (media gốc)' : 'Tạo mẫu thiết kế'}
          width={640}
          open={templateDrawerOpen}
          onClose={closeTemplateDrawer}
          extra={
            <Button type="primary" onClick={saveTemplate} loading={submitting}>
              Lưu mẫu
            </Button>
          }
        >
          <Form form={templateForm} layout="vertical">
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="code" label="Mã mẫu" rules={[{ required: true }]}>
                  <Input placeholder="FIG-001" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" label="Tên mẫu" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item name="fileUrl" hidden>
              <Input type="hidden" />
            </Form.Item>
            <Form.Item name="thumbnailUrl" hidden>
              <Input type="hidden" />
            </Form.Item>

            <div className="product-mgmt__media-stack">
              <ProductFileUpload
                label="File 3D"
                required
                hint="GLB có xem trước 3D. Mọi biến thể dùng chung file này."
                accept=".glb,.stl,.obj"
                allowedLabel=".glb, .stl, .obj"
                previewType="model"
                value={fileUrlWatch}
                onChange={(url) => templateForm.setFieldValue('fileUrl', url || '')}
              />
              <ProductFileUpload
                label="Ảnh thumbnail"
                hint="Ảnh hiển thị trên danh sách cửa hàng (khuyến nghị)."
                accept=".png,.jpg,.jpeg,.webp"
                allowedLabel=".png, .jpg, .webp"
                previewType="image"
                value={thumbUrlWatch}
                onChange={(url) => templateForm.setFieldValue('thumbnailUrl', url || '')}
              />
            </div>

            <Alert
              type="info"
              showIcon
              className="mt-2"
              message="Chỉ upload tại mẫu — biến thể chỉ cần chất liệu, giá và tồn kho."
            />
          </Form>
        </Drawer>

        <Drawer
          title={editingVariant ? 'Sửa biến thể bán' : 'Thêm biến thể'}
          width={480}
          open={variantDrawerOpen}
          onClose={closeVariantDrawer}
          extra={
            <Button type="primary" onClick={saveVariant} loading={submitting}>
              Lưu
            </Button>
          }
        >
          {variantInheritPanel}
          <Form form={variantForm} layout="vertical" onClick={(e) => e.stopPropagation()}>
            <Form.Item name="code" label="Mã SKU" rules={[{ required: true }]}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="name" label="Tên trên cửa hàng" rules={[{ required: true }]}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="materialId" label="Vật liệu" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="children">
                {materials.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
                  <InputNumber className="w-full" min={0} controls />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="stockQuantity" label="Tồn kho" rules={[{ required: true }]}>
                  <InputNumber className="w-full" min={0} controls />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="sizeScale" label="Scale">
                  <InputNumber className="w-full" min={0} step={0.1} controls />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="isAllowPreOrder" label="Pre-order" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Collapse
              ghost
              items={[
                {
                  key: 'override',
                  label: <Text type="secondary">File 3D riêng (tuỳ chọn — hiếm khi cần)</Text>,
                  children: (
                    <>
                      <Form.Item name="useTemplateMedia" valuePropName="checked" label="Dùng file mẫu">
                        <Switch
                          checkedChildren="Mẫu"
                          unCheckedChildren="Riêng"
                          onChange={(checked) => {
                            if (checked) variantForm.setFieldValue('previewModelUrl', '');
                          }}
                        />
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate={(p, c) => p.useTemplateMedia !== c.useTemplateMedia}>
                        {({ getFieldValue, setFieldValue }) =>
                          !getFieldValue('useTemplateMedia') ? (
                            <>
                              <Form.Item name="previewModelUrl" hidden>
                                <Input />
                              </Form.Item>
                              <ProductFileUpload
                                label="File 3D riêng cho biến thể này"
                                hint="Chỉ dùng khi phiên bản in khác file mẫu."
                                accept=".glb,.stl,.obj"
                                allowedLabel=".glb, .stl, .obj"
                                previewType="model"
                                value={getFieldValue('previewModelUrl')}
                                onChange={(url) => setFieldValue('previewModelUrl', url || '')}
                              />
                            </>
                          ) : null
                        }
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          </Form>
        </Drawer>

        <div className="flex justify-end">
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openTemplateDrawer(null)}>
            Thêm mẫu mới
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
