import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Tabs,
  Space,
  Upload,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Descriptions,
  Divider,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SettingOutlined,
  DollarOutlined,
  BarcodeOutlined,
  InboxOutlined,
  SearchOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import designVariantApi from '../../api/designVariantApi';
import materialApi from '../../api/materialApi';
import designTemplateApi from '../../api/designTemplateApi';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [designTemplates, setDesignTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterialId, setFilterMaterialId] = useState(null);
  const [filterTemplateId, setFilterTemplateId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchInitialData();
      fetchProducts(1); // Fetch list mặc định khi vào trang
    };
    init();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [materialsRes, templatesRes] = await Promise.all([
        materialApi.getAll(),
        designTemplateApi.query({ pageNumber: 1, pageSize: 100, isActive: true })
      ]);
      setMaterials(Array.isArray(materialsRes) ? materialsRes : (materialsRes?.data || []));
      setDesignTemplates(Array.isArray(templatesRes) ? templatesRes : (templatesRes?.data || []));
    } catch (error) {
      console.error('Failed to fetch initial data', error);
      message.error('Không thể tải danh sách vật liệu hoặc mẫu thiết kế');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (page = 1, search = searchTerm, matId = filterMaterialId, tempId = filterTemplateId) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: pagination.pageSize,
        search: search || "",
        isActive: true
      };
      
      // Chỉ gửi ID nếu có giá trị để tránh lỗi 400 nếu backend check định dạng GUID
      if (tempId) params.designTemplateId = tempId;
      if (matId) params.materialId = matId;
      
      const response = await designVariantApi.getAll(params);
      // Backend thường trả về { data: [...] } hoặc trực tiếp [...]
      const productList = Array.isArray(response) ? response : (response?.data || []);
      setProducts(productList);
      
      setPagination({
        ...pagination,
        current: page,
        total: response?.additionalData?.paging?.totalCount || productList.length,
      });
    } catch (error) {
      console.error('Failed to fetch products', error);
      // Nếu lỗi 404 do endpoint chưa map method, ta log rõ hơn
      if (error.response?.status === 404) {
         message.error('Endpoint /api/design-variant/all không tìm thấy (404). Kiểm tra lại method hoặc path backend.');
      } else {
         message.error('Lỗi tải danh sách sản phẩm');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when filters change if both are selected (based on user request)
  useEffect(() => {
    if (filterMaterialId || filterTemplateId || searchTerm) {
      fetchProducts(1);
    }
  }, [filterMaterialId, filterTemplateId]);

  // --- Handlers ---

  // --- Handlers ---

  const handleOpenDrawer = (product = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue({
        ...product,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        sizeScale: 1,
        stockQuantity: 0,
        isAllowPreOrder: false
      });
    }
    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
    setEditingProduct(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        ...values,
        estimatedWeightPerUnit: values.estimatedWeightPerUnit || 0,
        estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit || 0,
      };

      if (editingProduct) {
        const updatePayload = {
          id: editingProduct.id,
          materialId: values.materialId,
          code: values.code,
          name: values.name,
          sizeScale: values.sizeScale || 0,
          stockQuantity: values.stockQuantity || 0,
          price: values.price || 0,
          isAllowPreOrder: values.isAllowPreOrder !== undefined ? values.isAllowPreOrder : true,
          estimatedWeightPerUnit: values.estimatedWeightPerUnit || 0,
          estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit || 0,
        };
        await designVariantApi.update(updatePayload);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        const addPayload = {
          designTemplateId: values.designTemplateId,
          materialId: values.materialId,
          code: values.code,
          name: values.name,
          sizeScale: values.sizeScale || 0,
          stockQuantity: values.stockQuantity || 0,
          price: values.price || 0,
          isAllowPreOrder: values.isAllowPreOrder !== undefined ? values.isAllowPreOrder : true,
          estimatedWeightPerUnit: values.estimatedWeightPerUnit || 0,
          estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit || 0,
        };
        await designVariantApi.add(addPayload);
        message.success('Thêm sản phẩm thành công');
      }
      
      fetchProducts(pagination.current);
      handleCloseDrawer();
    } catch (error) {
      console.error('Save Failed:', error);
      const errorMsg = error.response?.data?.message || 'Thao tác thất bại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await designVariantApi.delete(id);
      message.success('Đã xóa sản phẩm');
      fetchProducts(pagination.current);
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  // --- UI Components ---

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã số',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <span className="font-mono font-medium text-blue-600">{text}</span>
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mẫu thiết kế',
      dataIndex: 'designTemplateId',
      key: 'designTemplateId',
      render: (id) => designTemplates.find(t => t.id === id)?.name || <Tag color="orange">N/A</Tag>
    },
    {
      title: 'Vật liệu',
      dataIndex: 'materialId',
      key: 'materialId',
      render: (id) => materials.find(m => m.id === id)?.name || <Tag color="gray">N/A</Tag>
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (val) => <span className="text-red-500 font-semibold">{val?.toLocaleString()} đ</span>
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      render: (val) => (
        <Tag color={val > 10 ? 'green' : (val > 0 ? 'orange' : 'red')}>
          {val}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Active' : 'Deactive'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined className="text-indigo-600" />} 
              onClick={() => handleOpenDrawer(record)}
            />
          </Tooltip>
          <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Logic to watch options changes and update variants
  // In a real app, this is complex. Here we assume manual trigger or simple mapping.
  // For the sake of this prompt, we'll implement the UI for the Variant Generation button.

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-gray-500">Quản lý danh sách sản phẩm, biến thể và tồn kho</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={() => handleOpenDrawer(null)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Thêm sản phẩm
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <Row gutter={16}>
             <Col span={8}>
               <Input 
                 placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..." 
                 prefix={<SearchOutlined />} 
                 onPressEnter={e => fetchProducts(1, e.target.value)}
                 onChange={e => setSearchTerm(e.target.value)}
                 allowClear
               />
             </Col>
             <Col span={6}>
               <Select 
                 placeholder="Chọn Mẫu thiết kế" 
                 style={{ width: '100%' }} 
                 allowClear
                 showSearch
                 optionFilterProp="children"
                 value={filterTemplateId}
                 onChange={value => {
                   setFilterTemplateId(value);
                   fetchProducts(1, searchTerm, filterMaterialId, value);
                 }}
               >
                 {designTemplates.map(t => (
                   <Option key={t.id} value={t.id}>{t.name} ({t.code})</Option>
                 ))}
               </Select>
             </Col>
             <Col span={6}>
               <Select 
                 placeholder="Chọn Vật liệu" 
                 style={{ width: '100%' }} 
                 allowClear
                 showSearch
                 optionFilterProp="children"
                 value={filterMaterialId}
                 onChange={value => {
                   setFilterMaterialId(value);
                   fetchProducts(1, searchTerm, value, filterTemplateId);
                 }}
               >
                 {materials.map(m => (
                   <Option key={m.id} value={m.id}>{m.name}</Option>
                 ))}
               </Select>
             </Col>
             <Col span={2}>
               <Button 
                 icon={<SearchOutlined />} 
                 type="primary"
                 onClick={() => fetchProducts(1)}
                 block
               >
                 Tìm kiếm
               </Button>
             </Col>
             <Col span={2}>
               <Button 
                 onClick={() => {
                   setSearchTerm('');
                   setFilterTemplateId(null);
                   setFilterMaterialId(null);
                   fetchProducts(1, '', null, null);
                 }}
                 block
               >
                 Xóa lọc
               </Button>
             </Col>
          </Row>
        </Card>

        {/* Main Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table 
            columns={columns} 
            dataSource={products} 
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) => fetchProducts(page)
            }}
          />
        </div>

        {/* Drawer Form */}
        <Drawer
          title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          width={720}
          onClose={handleCloseDrawer}
          open={isDrawerVisible}
          extra={
            <Space>
              <Button onClick={handleCloseDrawer}>Hủy</Button>
              <Button type="primary" onClick={handleSave} className="bg-indigo-600">
                Lưu sản phẩm
              </Button>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ isActive: true, sizeScale: 1, stockQuantity: 0, isAllowPreOrder: false }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="designTemplateId"
                  label="Mẫu thiết kế"
                  rules={[{ required: true, message: 'Vui lòng chọn mẫu thiết kế' }]}
                >
                  <Select placeholder="Chọn mẫu thiết kế" showSearch optionFilterProp="children">
                    {designTemplates.map(t => (
                      <Option key={t.id} value={t.id}>{t.name} ({t.code})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="materialId"
                  label="Vật liệu"
                  rules={[{ required: true, message: 'Vui lòng chọn vật liệu' }]}
                >
                  <Select placeholder="Chọn vật liệu" showSearch optionFilterProp="children">
                    {materials.map(m => (
                      <Option key={m.id} value={m.id}>{m.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="Mã sản phẩm (Code)"
                  rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm' }]}
                >
                  <Input prefix={<BarcodeOutlined />} placeholder="VD: DV-001" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên sản phẩm"
                  rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                >
                  <Input placeholder="VD: Sản phẩm mẫu A" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={8}>
                 <Form.Item
                  name="price"
                  label="Giá bán (VNĐ)"
                  rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="stockQuantity"
                  label="Số lượng tồn kho"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sizeScale"
                  label="Tỉ lệ Scale"
                  rules={[{ required: true }]}
                >
                  <InputNumber style={{ width: '100%' }} step={0.1} min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" plain>Thông số bổ sung</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="estimatedWeightPerUnit"
                  label="Khối lượng ước tính (g)"
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estimatedPrintTimePerUnit"
                  label="Thời gian in ước tính (phút)"
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="isAllowPreOrder" label="Cho phép đặt trước" valuePropName="checked">
                   <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
                   <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default ManageProducts;
