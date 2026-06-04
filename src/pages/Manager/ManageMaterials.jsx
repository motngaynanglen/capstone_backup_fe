import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Tag, Card, Row, Col, Space, message, Typography, Divider, Tooltip, Switch, Popconfirm, Pagination,
  Tabs, DatePicker, Timeline, Alert, Spin
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import materialApi from '../../api/materialApi';
import conceptTagApi from '../../api/conceptTagApi';
import { format } from 'date-fns';

const { Title, Text } = Typography;
const { Search } = Input;

const ManageMaterials = () => {
  // --- State ---
  const [materials, setMaterials] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Tag Pagination & Search State
  const [tagSearchText, setTagSearchText] = useState('');
  const [tagPagination, setTagPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Modal States
  const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
  const [isUpdateMaterialModalVisible, setIsUpdateMaterialModalVisible] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  
  // Forms
  const [materialForm] = Form.useForm();
  const [updateMaterialForm] = Form.useForm();
  const [updateInfoForm] = Form.useForm();
  const [updatePriceForm] = Form.useForm();
  const [tagForm] = Form.useForm();

  // Selected Items
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  // Price History
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isPriceHistoryVisible, setIsPriceHistoryVisible] = useState(false);

  // --- Fetch Data ---
  const fetchMaterials = async (searchText = '') => {
    setLoadingMaterials(true);
    try {
      const response = await materialApi.getAll();
      
      // BaseResponseModel: { statusCode: 200, data: [...] }
      let fetchedData = response.data || [];
      
      // Lọc client side nếu endpoint getAll không hỗ trợ params search
      if (searchText) {
        fetchedData = fetchedData.filter(m => 
          m.name.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      setMaterials(fetchedData); 
    } catch (error) {
      console.error("Failed to fetch materials", error);
      message.error('Lỗi khi tải danh sách vật liệu từ máy chủ.');
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchTags = async (page = 1, search = '') => {
    setLoadingTags(true);
    try {
      const response = await conceptTagApi.query({
         pageNumber: page,
         pageSize: tagPagination.pageSize,
         search: search
      });
      // response could be { data: [...], additionalData: { paging... } } or direct array
      const fetchedTags = Array.isArray(response) ? response : (response?.data || []);
      setTags(fetchedTags);

      setTagPagination(prev => ({
        ...prev,
        current: page,
        total: response?.additionalData?.paging?.totalCount || fetchedTags.length
      }));
    } catch (error) {
      console.error("Failed to fetch tags", error);
      setTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchTags(1, '');
  }, []);

  // --- Handlers: Material ---

  const handleCreateMaterial = async (values) => {
    try {
      // Backend yêu cầu effectiveDate
      const payload = {
        ...values,
        effectiveDate: new Date().toISOString()
      };
      
      await materialApi.add(payload);
      message.success('Thêm vật liệu thành công');
      setIsMaterialModalVisible(false);
      materialForm.resetFields();
      fetchMaterials();
    } catch (error) {
      message.error('Thêm vật liệu thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // === CẬP NHẬT VẬT LIỆU — 3 PHẦN ===

  const openUpdateMaterialModal = (record) => {
    setSelectedMaterial(record);
    updateInfoForm.setFieldsValue({ name: record.name, description: record.description });
    updatePriceForm.resetFields();
    setIsUpdateMaterialModalVisible(true);
  };

  // Tab 1: Cập nhật thông tin (tên, mô tả)
  const handleUpdateInfo = async (values) => {
    if (!selectedMaterial) return;
    try {
      await materialApi.update(selectedMaterial.id, { name: values.name, description: values.description });
      message.success('Đã cập nhật thông tin vật liệu');
      fetchMaterials();
      setSelectedMaterial(prev => ({ ...prev, name: values.name, description: values.description }));
    } catch (error) {
      message.error(error?.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  // Tab 2: Toggle Active/Deactive
  const handleToggleActive = async (id, checked) => {
    try {
      if (checked) {
        await materialApi.activate(id);
        message.success('Đã kích hoạt vật liệu');
      } else {
        await materialApi.deactivate(id);
        message.success('Đã vô hiệu hóa vật liệu');
      }
      fetchMaterials();
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(prev => prev ? { ...prev, isActive: checked } : prev);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Thay đổi trạng thái thất bại — vật liệu cần có giá hiện hành để kích hoạt.');
    }
  };

  // Tab 3: Cập nhật giá
  const handleUpdatePrice = async (values) => {
    if (!selectedMaterial) return;
    try {
      await materialApi.updatePrice(selectedMaterial.id, {
        baseCostPerGram: values.baseCostPerGram,
        totalServiceCostPerGram: values.totalServiceCostPerGram,
        effectiveDate: values.effectiveDate?.toISOString() || new Date().toISOString(),
      });
      message.success('Đã cập nhật giá — giá biến thể đang active sẽ được đồng bộ.');
      updatePriceForm.resetFields();
      fetchMaterials();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Cập nhật giá thất bại');
    }
  };

  // Xóa vật liệu
  const handleDeleteMaterial = async (id) => {
    try {
      await materialApi.delete(id);
      message.success('Đã xóa vật liệu');
      fetchMaterials();
    } catch (error) {
      const msg = error?.response?.data?.message || '';
      if (msg.includes('variant') || msg.includes('sản phẩm') || msg.includes('biến thể')) {
        message.warning('Không thể xóa — vật liệu đang được dùng bởi sản phẩm. Hãy vô hiệu hóa thay thế.');
      } else {
        message.error(msg || 'Xóa thất bại');
      }
    }
  };

  // Lịch sử giá
  const openPriceHistory = async (material) => {
    setSelectedMaterial(material);
    setLoadingHistory(true);
    setIsPriceHistoryVisible(true);
    try {
      const res = await materialApi.getPriceHistory(material.id);
      const history = (res?.data || []).slice(0, 5);
      setPriceHistory(history);
    } catch {
      message.error('Không tải được lịch sử giá');
      setPriceHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- Handlers: Tags ---

  const handleCreateOrUpdateTag = async (values) => {
    try {
      if (selectedTag) {
        // Update
        await conceptTagApi.update(selectedTag.id, { ...values, isActive: true });
        message.success('Cập nhật thẻ thành công');
      } else {
        // Create
        await conceptTagApi.add({ ...values, isActive: true });
        message.success('Thêm thẻ mới thành công');
      }
      setIsTagModalVisible(false);
      tagForm.resetFields();
      setSelectedTag(null);
      fetchTags(tagPagination.current, tagSearchText);
    } catch (error) {
      message.error('Thao tác thất bại');
    }
  };

  const handleDeleteTag = async (id) => {
    Modal.confirm({
      title: 'Xóa thẻ phân loại?',
      content: 'Bạn có chắc chắn muốn xóa thẻ này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await conceptTagApi.delete(id);
          message.success('Đã xóa thẻ');
          fetchTags(tagPagination.current, tagSearchText);
        } catch (error) {
          message.error('Xóa thất bại');
        }
      }
    });
  };

  const openEditTagModal = (tag) => {
    setSelectedTag(tag);
    tagForm.setFieldsValue(tag);
    setIsTagModalVisible(true);
  };

  // --- Columns ---

  const materialColumns = [
    {
      title: 'Tên Vật liệu',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Giá Vốn (VNĐ/g)',
      dataIndex: 'baseCostPerGram',
      key: 'baseCostPerGram',
      render: (val) => val ? val.toLocaleString() : '-',
    },
    {
      title: 'Giá Dịch vụ (VNĐ/g)',
      dataIndex: 'totalServiceCostPerGram',
      key: 'totalServiceCostPerGram',
      render: (val) => val ? <Tag color="blue">{val.toLocaleString()}</Tag> : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active, record) => (
         <Switch 
           checked={active} 
           onChange={(checked) => handleToggleActive(record.id, checked)} 
         />
      )
    },
    {
      title: 'Tác vụ',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Cập nhật">
            <Button type="text" icon={<EditOutlined />} onClick={() => openUpdateMaterialModal(record)} />
          </Tooltip>
          <Tooltip title="Lịch sử giá">
            <Button type="text" icon={<HistoryOutlined />} onClick={() => openPriceHistory(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa vật liệu?"
            description="Chỉ xóa được nếu không có sản phẩm nào đang dùng."
            onConfirm={() => handleDeleteMaterial(record.id)}
            okText="Xóa" okType="danger"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} style={{ margin: 0 }}>Quản lý Danh mục Lõi</Title>
            <Text type="secondary">Quản lý vật liệu in 3D và các thẻ phân loại thiết kế</Text>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          
          {/* Left Column: Materials */}
          <Col xs={24} lg={16}>
            <Card 
              title="Danh sách Vật liệu" 
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => { setIsMaterialModalVisible(true); materialForm.resetFields(); }}
                >
                  Thêm Vật liệu
                </Button>
              }
              className="shadow-sm rounded-lg"
            >
              <div className="mb-4">
                <Search 
                  placeholder="Tìm kiếm vật liệu..." 
                  onSearch={fetchMaterials} 
                  enterButton 
                  allowClear
                />
              </div>
              <Table 
                columns={materialColumns} 
                dataSource={materials} 
                rowKey="id" 
                loading={loadingMaterials}
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>

          {/* Right Column: Tags */}
          <Col xs={24} lg={8}>
            <Card 
              title="Thẻ Phân loại (Concept Tags)"
              extra={
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<PlusOutlined />} 
                  onClick={() => { setSelectedTag(null); tagForm.resetFields(); setIsTagModalVisible(true); }}
                >
                  Thêm
                </Button>
              }
              className="shadow-sm rounded-lg"
            >
              <div className="mb-4">
                <Search 
                  placeholder="Tìm kiếm thẻ phân loại..." 
                  onSearch={(value) => fetchTags(1, value)} 
                  onChange={(e) => setTagSearchText(e.target.value)}
                  value={tagSearchText}
                  enterButton 
                  allowClear
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <Tag 
                    key={tag.id} 
                    color="geekblue" 
                    closable 
                    onClose={(e) => { e.preventDefault(); handleDeleteTag(tag.id); }}
                    className="py-1 px-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openEditTagModal(tag)}
                  >
                    {tag.name}
                  </Tag>
                ))}
                {tags.length === 0 && !loadingTags && <Text type="secondary">Chưa có thẻ nào.</Text>}
              </div>
              <div className="flex justify-end">
                <Pagination 
                  current={tagPagination.current} 
                  pageSize={tagPagination.pageSize} 
                  total={tagPagination.total} 
                  onChange={(page) => fetchTags(page, tagSearchText)}
                  size="small"
                  showSizeChanger={false}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* --- MOALS --- */}

      {/* 1. Add Material Modal */}
      <Modal
        title="Thêm Vật liệu Mới"
        open={isMaterialModalVisible}
        onCancel={() => setIsMaterialModalVisible(false)}
        footer={null}
      >
        <Form form={materialForm} layout="vertical" onFinish={handleCreateMaterial}>
          <Form.Item 
            name="name" 
            label="Tên Vật liệu" 
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input placeholder="Ví dụ: Nhựa PLA Tough" />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label="Mô tả"
          >
            <Input.TextArea placeholder="Mô tả đặc tính..." rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="baseCostPerGram" 
                label="Giá vốn (VNĐ/g)" 
                rules={[{ required: true, message: 'Nhập giá vốn' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value?.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="totalServiceCostPerGram" 
                label="Giá dịch vụ (VNĐ/g)" 
                rules={[{ required: true, message: 'Nhập giá dịch vụ' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value?.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
          </Row>

          <div className="text-right">
            <Button onClick={() => setIsMaterialModalVisible(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu Vật liệu</Button>
          </div>
        </Form>
      </Modal>

      {/* 2. Update Material Modal — 3 Tabs */}
      <Modal
        title={<span>Cập nhật vật liệu: <Text type="success">{selectedMaterial?.name}</Text></span>}
        open={isUpdateMaterialModalVisible}
        onCancel={() => setIsUpdateMaterialModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs defaultActiveKey="info" items={[
          {
            key: 'info',
            label: 'Thông tin',
            children: (
              <Form form={updateInfoForm} layout="vertical" onFinish={handleUpdateInfo}>
                <Form.Item name="name" label="Tên Vật liệu" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                  <Input placeholder="Ví dụ: Nhựa PLA Tough" />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                  <Input.TextArea placeholder="Mô tả đặc tính..." rows={2} />
                </Form.Item>
                <Button type="primary" htmlType="submit">Lưu thông tin</Button>
              </Form>
            ),
          },
          {
            key: 'status',
            label: 'Trạng thái',
            children: (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text strong>Trạng thái hiện tại:</Text>
                    <div className="mt-1">
                      {selectedMaterial?.isActive
                        ? <Tag color="green">Active</Tag>
                        : <Tag color="red">Inactive</Tag>}
                    </div>
                  </div>
                  <Popconfirm
                    title={selectedMaterial?.isActive ? 'Vô hiệu hóa vật liệu?' : 'Kích hoạt vật liệu?'}
                    description={selectedMaterial?.isActive
                      ? 'Vật liệu sẽ không hiển thị cho khách hàng.'
                      : 'Vật liệu phải có giá hiện hành mới kích hoạt được.'}
                    onConfirm={() => handleToggleActive(selectedMaterial?.id, !selectedMaterial?.isActive)}
                  >
                    <Button type={selectedMaterial?.isActive ? 'default' : 'primary'} danger={selectedMaterial?.isActive}>
                      {selectedMaterial?.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ),
          },
          {
            key: 'price',
            label: 'Cập nhật giá',
            children: (
              <Form form={updatePriceForm} layout="vertical" onFinish={handleUpdatePrice}>
                <Alert
                  message="Cập nhật giá sẽ tự đồng bộ cho tất cả biến thể đang Active dùng vật liệu này."
                  type="info" showIcon className="mb-4"
                />
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="baseCostPerGram" label="Giá vốn (VNĐ/g)" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="totalServiceCostPerGram" label="Giá dịch vụ (VNĐ/g)" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="effectiveDate" label="Ngày hiệu lực">
                  <DatePicker style={{ width: '100%' }} placeholder="Mặc định: ngay bây giờ" />
                </Form.Item>
                <Button type="primary" htmlType="submit">Cập nhật giá</Button>
              </Form>
            ),
          },
        ]} />
      </Modal>

      {/* 2b. Price History Modal */}
      <Modal
        title={`Lịch sử giá — ${selectedMaterial?.name || ''}`}
        open={isPriceHistoryVisible}
        onCancel={() => setIsPriceHistoryVisible(false)}
        footer={null}
      >
        {loadingHistory ? <div className="text-center py-8"><Spin /></div> : priceHistory.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Chưa có lịch sử giá</div>
        ) : (
          <Timeline
            items={priceHistory.map((p, i) => ({
              color: i === 0 ? 'green' : 'gray',
              children: (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Text type="secondary" className="text-xs">
                      {p.effectiveDate ? format(new Date(p.effectiveDate), 'dd/MM/yyyy HH:mm') : (p.created ? format(new Date(p.created), 'dd/MM/yyyy HH:mm') : '—')}
                    </Text>
                    {i === 0 && <Tag color="green" className="text-xs">Hiện tại</Tag>}
                  </div>
                  <div>Giá vốn: <Text strong>{(p.baseCostPerGram || 0).toLocaleString()}</Text> VNĐ/g</div>
                  <div>Giá dịch vụ: <Text strong>{(p.totalServiceCostPerGram || 0).toLocaleString()}</Text> VNĐ/g</div>
                </div>
              ),
            }))}
          />
        )}
      </Modal>

      {/* 3. Tag Modal */}
      <Modal
        title={selectedTag ? "Cập nhật Thẻ" : "Thêm Thẻ Phân loại"}
        open={isTagModalVisible}
        onCancel={() => setIsTagModalVisible(false)}
        footer={null}
      >
        <Form form={tagForm} layout="vertical" onFinish={handleCreateOrUpdateTag}>
          <Form.Item 
            name="name" 
            label="Tên Thẻ" 
            rules={[{ required: true, message: 'Vui lòng nhập tên thẻ!' }]}
          >
            <Input placeholder="Ví dụ: Mechanical" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
           <div className="text-right">
            <Button onClick={() => setIsTagModalVisible(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">{selectedTag ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageMaterials;
