import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Select, Tag, Space, message, Image, Modal, Tooltip 
} from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import designTemplateApi from '../../api/designTemplateApi';
import conceptTagApi from '../../api/conceptTagApi';
import { format } from 'date-fns';

const { Search } = Input;
const { Option } = Select;

const ManageDesignTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTemplates = async (page = 1, search = searchText, tagId = selectedTagId) => {
    setLoading(true);
    try {
      let response;
      if (tagId) {
        // Lấy theo tag
        response = await designTemplateApi.getTemplatesByTag(tagId);
        const fetchedData = Array.isArray(response) ? response : (response.data || []);
        // Lọc thêm theo search nếu có
        const filtered = search ? fetchedData.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.code.toLowerCase().includes(search.toLowerCase())) : fetchedData;
        setTemplates(filtered);
        setPagination({
          ...pagination,
          current: 1,
          total: filtered.length,
        });
      } else {
        // Truy vấn phân trang
        const params = {
          pageNumber: page,
          pageSize: pagination.pageSize,
          search: search || "",
          isActive: true, 
          sortDescending: true,
          sortBy: "createdAt" 
        };
        response = await designTemplateApi.query(params);
        setTemplates(response.data || []);
        setPagination({
          ...pagination,
          current: page,
          total: response.additionalData?.paging?.totalCount || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch templates', error);
      message.error('Lỗi tải danh sách Design Template từ máy chủ.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const resp = await conceptTagApi.getAll();
      setTags(resp.data || []);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchTemplates();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchTemplates(1, value, selectedTagId);
  };

  const handleTagChange = (tagId) => {
    setSelectedTagId(tagId);
    fetchTemplates(1, searchText, tagId);
  };

  const handleTableChange = (newPagination) => {
    if (!selectedTagId) {
      fetchTemplates(newPagination.current);
    }
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa "${record.name}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await designTemplateApi.delete(record.id);
          if (response.code === 'SUCCESS') {
            message.success('Đã xóa sản phẩm thành công');
            fetchTemplates(pagination.current);
          } else {
            message.error(response.message || 'Xóa thất bại');
          }
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Xóa thất bại';
          const suggestion = error.response?.data?.additionalData?.suggestion;
          message.error(errorMsg + (suggestion ? ` ${suggestion}` : ''));
        }
      },
    });
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Ảnh mẫu',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnail',
      width: 80,
      render: (url) => (
        <Image
          src={url || 'https://picsum.photos/50'}
          alt="thumbnail"
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://picsum.photos/50"
        />
      ),
    },
    {
      title: 'Mã số',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <a
          onClick={() => navigate(`/manager/design-templates/edit/${record.id}`)}
          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          {name}
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Deactive'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (date ? format(new Date(date), 'dd/MM/yyyy') : '-'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/manager/design-templates/edit/${record.id}`)}
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Design Template</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý vòng đời sản phẩm mẫu in 3D</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/manager/design-templates/create')}
          size="large"
        >
          Thêm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <Search
            placeholder="Tìm kiếm theo tên hoặc mã..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Lọc theo thẻ (Tag)"
            allowClear
            size="large"
            style={{ width: '100%', minWidth: 200, maxWidth: 300 }}
            onChange={handleTagChange}
            value={selectedTagId}
          >
            {tags.map(tag => (
              <Option key={tag.id} value={tag.id}>{tag.name}</Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
};

export default ManageDesignTemplates;
