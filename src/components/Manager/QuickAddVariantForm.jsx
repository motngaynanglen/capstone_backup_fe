import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Row, Col, Switch, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * Form thêm biến thể nhanh trong dòng mở rộng của bảng.
 * Phải là component file riêng — tránh remount khi parent re-render.
 */
const QuickAddVariantForm = ({ template, materials, submitting, onRegisterForm, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    onRegisterForm?.(template.id, form);
  }, [template.id, form, onRegisterForm]);

  const suggestCode = (matId) => {
    const mat = materials.find((m) => String(m.id) === String(matId));
    const slug = mat?.name?.slice(0, 3).toUpperCase() || 'VAR';
    return `${template.code}-${slug}`;
  };

  return (
    <div className="product-mgmt__quick-add" onClick={(e) => e.stopPropagation()}>
      <div className="product-mgmt__quick-add-title">
        <PlusOutlined />
        Thêm biến thể nhanh
        <Tag color="processing" className="ml-1 font-normal">
          Dùng file & ảnh của mẫu
        </Tag>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={() => onSubmit(template, form)}
        initialValues={{ sizeScale: 1, stockQuantity: 0, isAllowPreOrder: true }}
      >
        <Row gutter={[12, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item name="materialId" label="Vật liệu" rules={[{ required: true }]}>
              <Select
                placeholder="Chọn chất liệu"
                showSearch
                optionFilterProp="label"
                options={materials
                  .filter((m) => m.isActive !== false)
                  .map((m) => ({ value: m.id, label: m.name }))}
                onChange={(id) => {
                  const cur = form.getFieldValue('code');
                  if (!cur) form.setFieldValue('code', suggestCode(id));
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="code" label="Mã SKU" rules={[{ required: true }]}>
              <Input placeholder={`${template.code}-PLA`} autoComplete="off" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}>
              <Input placeholder="VD: Bản tiêu chuẩn PLA" autoComplete="off" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
              <InputNumber
                className="w-full"
                min={0}
                controls
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v?.replace(/,/g, '')}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="stockQuantity" label="Tồn" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} controls />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="sizeScale" label="Scale">
              <InputNumber className="w-full" min={0} step={0.1} controls />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6} className="flex items-end">
            <Form.Item name="isAllowPreOrder" label="Pre-order" valuePropName="checked" className="w-full">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} className="flex justify-end">
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={submitting}>
              Thêm vào cửa hàng
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default QuickAddVariantForm;
