import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Card,
  Row,
  Col,
  Space,
  message,
  Typography,
  Divider,
  Tooltip,
  Switch,
  Popconfirm,
  Pagination,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import materialApi from "../../api/materialApi";
import materialInventoryApi from "../../api/materialInventoryApi";
import conceptTagApi from "../../api/conceptTagApi";
import { format } from "date-fns";

const { Title, Text } = Typography;
const { Search } = Input;

const LOW_STOCK_GRAMS = 50000;

const ManageMaterials = () => {
  // --- State ---
  const [materials, setMaterials] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Tag Pagination & Search State
  const [tagSearchText, setTagSearchText] = useState("");
  const [tagPagination, setTagPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal States
  const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
  const [isUpdateMaterialModalVisible, setIsUpdateMaterialModalVisible] =
    useState(false);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [tagModalIsMainTag, setTagModalIsMainTag] = useState(false);

  // Forms
  const [materialForm] = Form.useForm();
  const [updateMaterialForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [tagForm] = Form.useForm();

  // Selected Items
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  // --- Fetch Data ---
  const fetchMaterials = async (searchText = "") => {
    setLoadingMaterials(true);
    try {
      const response = await materialApi.getAll();

      // BaseResponseModel: { statusCode: 200, data: [...] }
      let fetchedData = response.data || [];

      // Lọc client side nếu endpoint getAll không hỗ trợ params search
      if (searchText) {
        fetchedData = fetchedData.filter((m) =>
          m.name.toLowerCase().includes(searchText.toLowerCase()),
        );
      }

      setMaterials(fetchedData);
    } catch (error) {
      console.error("Failed to fetch materials", error);
      message.error("Lỗi khi tải danh sách vật liệu từ máy chủ.");
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchTags = async (page = 1, search = "") => {
    setLoadingTags(true);
    try {
      const response = await conceptTagApi.query({
        pageNumber: page,
        pageSize: tagPagination.pageSize,
        search: search,
      });
      // response could be { data: [...], additionalData: { paging... } } or direct array
      const fetchedTags = Array.isArray(response)
        ? response
        : response?.data || [];
      setTags(fetchedTags);

      setTagPagination((prev) => ({
        ...prev,
        current: page,
        total:
          response?.additionalData?.paging?.totalCount || fetchedTags.length,
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
    fetchTags(1, "");
  }, []);

  // --- Handlers: Material ---

  const handleCreateMaterial = async (values) => {
    try {
      // Backend yêu cầu effectiveDate
      const payload = {
        ...values,
        effectiveDate: new Date().toISOString(),
      };

      await materialApi.add(payload);
      message.success("Thêm vật liệu thành công");
      setIsMaterialModalVisible(false);
      materialForm.resetFields();
      fetchMaterials();
    } catch (error) {
      message.error(
        "Thêm vật liệu thất bại: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleUpdateMaterial = async (values) => {
    if (!selectedMaterial) return;
    try {
      const payload = {
        name: values.name,
        description: values.description,
        baseCostPerGram: values.baseCostPerGram,
        totalServiceCostPerGram: values.totalServiceCostPerGram,
        effectiveDate: new Date().toISOString(),
      };

      await materialApi.update(selectedMaterial.id, payload);
      message.success("Cập nhật vật liệu thành công");
      setIsUpdateMaterialModalVisible(false);
      updateMaterialForm.resetFields();
      fetchMaterials(); // Refresh to show new current price
    } catch (error) {
      message.error("Cập nhật vật liệu thất bại");
    }
  };

  const openUpdateMaterialModal = (record) => {
    setSelectedMaterial(record);
    updateMaterialForm.setFieldsValue({
      name: record.name,
      description: record.description,
      baseCostPerGram: record.baseCostPerGram,
      totalServiceCostPerGram: record.totalServiceCostPerGram,
    });
    setIsUpdateMaterialModalVisible(true);
  };

  const handleToggleActive = async (id) => {
    try {
      await materialApi.toggleActive(id);
      message.success(`Đã thay đổi trạng thái vật liệu`);
      fetchMaterials();
    } catch (error) {
      message.error("Thay đổi trạng thái thất bại");
    }
  };

  const openStockModal = (record) => {
    setSelectedMaterial(record);
    stockForm.resetFields();
    stockForm.setFieldsValue({ type: "PURCHASE_IN" });
    setIsStockModalVisible(true);
  };

  const handleRestockMaterial = async (values) => {
    if (!selectedMaterial) return;
    try {
      const grams = Number(values.quantityGrams);
      if (!grams || grams <= 0) {
        message.warning("Số lượng gram phải lớn hơn 0");
        return;
      }
      await materialInventoryApi.create({
        materialId: selectedMaterial.id,
        type: values.type || "PURCHASE_IN",
        quantityGrams: grams,
        note: values.note?.trim() || undefined,
      });
      message.success("Nhập kho vật liệu thành công");
      setIsStockModalVisible(false);
      stockForm.resetFields();
      fetchMaterials();
    } catch (error) {
      message.error(error?.response?.data?.message || "Nhập kho thất bại");
    }
  };

  const lowStockMaterials = materials.filter(
    (m) => (m.stockQuantityGrams ?? 0) < LOW_STOCK_GRAMS,
  );

  // --- Handlers: Tags ---

  const handleCreateOrUpdateTag = async (values) => {
    try {
      if (selectedTag) {
        // Update
        await conceptTagApi.update(selectedTag.id, {
          ...values,
          isActive: true,
        });
        message.success("Cập nhật thẻ thành công");
      } else {
        // Create
        await conceptTagApi.add({ ...values, isActive: true });
        message.success("Thêm thẻ mới thành công");
      }
      setIsTagModalVisible(false);
      tagForm.resetFields();
      setSelectedTag(null);
      fetchTags(tagPagination.current, tagSearchText);
    } catch (error) {
      message.error("Thao tác thất bại");
    }
  };

  const handleDeleteTag = async (id) => {
    Modal.confirm({
      title: "Xóa thẻ phân loại?",
      content: "Bạn có chắc chắn muốn xóa thẻ này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await conceptTagApi.delete(id);
          message.success("Đã xóa thẻ");
          fetchTags(tagPagination.current, tagSearchText);
        } catch (error) {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const mainTags = tags.filter((t) => t.isMainTag);
  const regularTags = tags.filter((t) => !t.isMainTag);

  const openCreateTagModal = (isMainTag = false) => {
    setSelectedTag(null);
    setTagModalIsMainTag(isMainTag);
    tagForm.resetFields();
    tagForm.setFieldsValue({ isMainTag });
    setIsTagModalVisible(true);
  };

  const openEditTagModal = (tag) => {
    setSelectedTag(tag);
    setTagModalIsMainTag(Boolean(tag.isMainTag));
    tagForm.setFieldsValue(tag);
    setIsTagModalVisible(true);
  };

  // --- Columns ---

  const materialColumns = [
    {
      title: "Tên Vật liệu",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Giá Vốn (VNĐ/g)",
      dataIndex: "baseCostPerGram",
      key: "baseCostPerGram",
      render: (val) => (val ? val.toLocaleString() : "-"),
    },
    {
      title: "Giá Dịch vụ (VNĐ/g)",
      dataIndex: "totalServiceCostPerGram",
      key: "totalServiceCostPerGram",
      render: (val) =>
        val ? <Tag color="blue">{val.toLocaleString()}</Tag> : "-",
    },
    {
      title: "Tồn kho (g)",
      dataIndex: "stockQuantityGrams",
      key: "stockQuantityGrams",
      align: "right",
      render: (val, record) => {
        const grams = Number(val) || 0;
        const isLow = grams < LOW_STOCK_GRAMS;
        return (
          <Space
            direction="vertical"
            size={0}
            style={{ alignItems: "flex-end" }}
          >
            <Text strong style={{ color: isLow ? "#dc2626" : "#059669" }}>
              {grams.toLocaleString()} g
            </Text>
            {isLow && <Tag color="orange">Cần nhập bổ sung</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (active, record) => (
        <Space>
          <Switch
            checked={active}
            onChange={() => handleToggleActive(record.id)}
          />
          {!active && <Tag color="default">Đã tắt</Tag>}
        </Space>
      ),
    },
    {
      title: "Tác vụ",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Nhập kho bổ sung">
            <Button
              type="text"
              icon={<InboxOutlined />}
              onClick={() => openStockModal(record)}
              className="text-emerald-600 hover:text-emerald-800"
            />
          </Tooltip>
          <Tooltip title="Cập nhật">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openUpdateMaterialModal(record)}
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
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
            <Title level={2} style={{ margin: 0 }}>
              Quản lý Danh mục Lõi
            </Title>
            <Text type="secondary">
              Quản lý vật liệu in 3D và các thẻ phân loại thiết kế
            </Text>
          </div>
        </div>

        {lowStockMaterials.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`${lowStockMaterials.length} vật liệu dưới ngưỡng ${LOW_STOCK_GRAMS.toLocaleString()}g`}
            description={
              <span>
                Cần nhập bổ sung:{" "}
                {lowStockMaterials.map((m) => m.name).join(", ")}
              </span>
            }
          />
        )}

        <Row gutter={[24, 24]}>
          {/* Left Column: Materials */}
          <Col xs={24} lg={16}>
            <Card
              title="Danh sách Vật liệu"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setIsMaterialModalVisible(true);
                    materialForm.resetFields();
                  }}
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
              title="Thẻ"
              extra={
                <Space size="small">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openCreateTagModal(true)}
                  >
                    Main Tag
                  </Button>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openCreateTagModal(false)}
                  >
                    Thẻ thường
                  </Button>
                </Space>
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

              <Text
                type="secondary"
                className="block mb-2 text-xs uppercase tracking-wide"
              >
                Danh mục chính (Main Tag)
              </Text>
              <div className="flex flex-wrap gap-2 mb-4">
                {mainTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    color="gold"
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      handleDeleteTag(tag.id);
                    }}
                    className="py-1 px-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openEditTagModal(tag)}
                  >
                    {tag.name}
                  </Tag>
                ))}
                {mainTags.length === 0 && !loadingTags && (
                  <Text type="secondary">Chưa có Main Tag.</Text>
                )}
              </div>

              <Text
                type="secondary"
                className="block mb-2 text-xs uppercase tracking-wide"
              >
                Thẻ phân loại
              </Text>
              <div className="flex flex-wrap gap-2 mb-4">
                {regularTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    color="geekblue"
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      handleDeleteTag(tag.id);
                    }}
                    className="py-1 px-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openEditTagModal(tag)}
                  >
                    {tag.name}
                  </Tag>
                ))}
                {regularTags.length === 0 && !loadingTags && (
                  <Text type="secondary">Chưa có thẻ thường.</Text>
                )}
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
        <Form
          form={materialForm}
          layout="vertical"
          onFinish={handleCreateMaterial}
        >
          <Form.Item
            name="name"
            label="Tên Vật liệu"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Ví dụ: Nhựa PLA Tough" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả đặc tính..." rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="baseCostPerGram"
                label="Giá vốn (VNĐ/g)"
                rules={[{ required: true, message: "Nhập giá vốn" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalServiceCostPerGram"
                label="Giá dịch vụ (VNĐ/g)"
                rules={[{ required: true, message: "Nhập giá dịch vụ" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="text-right">
            <Button
              onClick={() => setIsMaterialModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu Vật liệu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 2. Update Material Modal */}
      <Modal
        title={
          <span>
            Cập nhật vật liệu:{" "}
            <Text type="success">{selectedMaterial?.name}</Text>
          </span>
        }
        open={isUpdateMaterialModalVisible}
        onCancel={() => setIsUpdateMaterialModalVisible(false)}
        footer={null}
      >
        <Form
          form={updateMaterialForm}
          layout="vertical"
          onFinish={handleUpdateMaterial}
        >
          <Form.Item
            name="name"
            label="Tên Vật liệu"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Ví dụ: Nhựa PLA Tough" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả đặc tính..." rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="baseCostPerGram"
                label="Giá vốn (VNĐ/g)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalServiceCostPerGram"
                label="Giá dịch vụ (VNĐ/g)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <div className="text-right">
            <Button
              onClick={() => setIsUpdateMaterialModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Cập nhật Vật liệu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 2b. Restock Material Modal */}
      <Modal
        title={
          <span>
            Nhập kho bổ sung:{" "}
            <Text type="success">{selectedMaterial?.name}</Text>
          </span>
        }
        open={isStockModalVisible}
        onCancel={() => setIsStockModalVisible(false)}
        footer={null}
      >
        <Text type="secondary" className="block mb-4">
          Tồn hiện tại:{" "}
          <Text strong>
            {Number(selectedMaterial?.stockQuantityGrams || 0).toLocaleString()}{" "}
            g
          </Text>
        </Text>
        <Form
          form={stockForm}
          layout="vertical"
          onFinish={handleRestockMaterial}
        >
          <Form.Item
            name="quantityGrams"
            label="Số lượng nhập (gram)"
            rules={[{ required: true, message: "Nhập số gram cần bổ sung" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="VD: 10000"
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Lý do nhập kho..." />
          </Form.Item>
          <Form.Item name="type" hidden initialValue="PURCHASE_IN">
            <Input />
          </Form.Item>
          <div className="text-right">
            <Button
              onClick={() => setIsStockModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Xác nhận nhập kho
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 3. Tag Modal */}
      <Modal
        title={
          selectedTag
            ? `Cập nhật ${tagModalIsMainTag ? "Main Tag" : "Thẻ phân loại"}`
            : tagModalIsMainTag
              ? "Thêm Main Tag (Danh mục chính)"
              : "Thêm Thẻ Phân loại"
        }
        open={isTagModalVisible}
        onCancel={() => setIsTagModalVisible(false)}
        footer={null}
      >
        <Form
          form={tagForm}
          layout="vertical"
          onFinish={handleCreateOrUpdateTag}
        >
          <Form.Item
            name="name"
            label="Tên Thẻ"
            rules={[{ required: true, message: "Vui lòng nhập tên thẻ!" }]}
          >
            <Input
              placeholder={
                tagModalIsMainTag
                  ? "Ví dụ: Figure, Miniature"
                  : "Ví dụ: Mechanical, Fantasy"
              }
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isMainTag" hidden>
            <Input />
          </Form.Item>
          <div className="text-right">
            <Button
              onClick={() => setIsTagModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {selectedTag ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageMaterials;
