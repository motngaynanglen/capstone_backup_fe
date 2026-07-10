import React, { useState, useEffect } from 'react';
import {
  Table, Input, Select, Button, Modal, Avatar, Rate, Tag, Space, Card, Row, Col,
  Statistic, Empty, Tooltip, Image, Form, Typography, message
} from 'antd';
import {
  SearchOutlined, EyeOutlined, MessageOutlined, DeleteOutlined, StarFilled,
  ReloadOutlined, StopOutlined, CheckCircleOutlined, RiseOutlined, SmileOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import feedbackApi from '../../api/feedbackApi';

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;
const { Title, Text } = Typography;

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchFeedbacks(1);
  }, []);

  const fetchFeedbacks = async (page = 1, search = searchQuery, rating = ratingFilter) => {
    setLoading(true);
    try {
      const res = await feedbackApi.query({
        search: search || '',
        rating: rating || null,
        pageNumber: page,
        pageSize: pagination.pageSize,
      });
      const list = res?.data || [];
      setFeedbacks(list);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: res?.additionalData?.paging?.totalCount || list.length,
      }));
    } catch (err) {
      message.error('Không thể tải danh sách feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchFeedbacks(1, searchQuery, ratingFilter);

  const handleReset = () => {
    setSearchQuery('');
    setRatingFilter(null);
    fetchFeedbacks(1, '', null);
  };

  const handleViewDetails = (record) => {
    setSelectedFeedback(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenReply = (record) => {
    setSelectedFeedback(record);
    setReplyText(record.replyContent || '');
    setIsReplyModalOpen(true);
  };

  const handleReply = async () => {
    if (!replyText.trim()) { message.warning('Vui lòng nhập nội dung phản hồi'); return; }
    setReplying(true);
    try {
      await feedbackApi.reply(selectedFeedback.id, replyText);
      message.success('Đã gửi phản hồi thành công!');
      setIsReplyModalOpen(false);
      fetchFeedbacks(pagination.current);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Phản hồi thất bại');
    } finally {
      setReplying(false);
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      await feedbackApi.toggleStatus(record.id);
      message.success(record.isHidden ? 'Đã hiện feedback' : 'Đã ẩn feedback');
      fetchFeedbacks(pagination.current);
    } catch (err) {
      message.error('Thao tác thất bại');
    }
  };

  const handleDelete = (record) => {
    confirm({
      title: 'Xóa feedback này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await feedbackApi.delete(record.id);
          message.success('Đã xóa feedback');
          fetchFeedbacks(pagination.current);
        } catch (err) {
          message.error(err?.response?.data?.message || 'Xóa thất bại');
        }
      }
    });
  };

  // -- Stats từ data đang load
  const total = pagination.total;
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;
  const satisfactionRate = feedbacks.length > 0
    ? ((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100).toFixed(0)
    : 0;

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 160,
      render: (name, record) => (
        <Space>
          <Avatar icon={<MessageOutlined />} />
          <div>
            <div className="font-medium">{name || '—'}</div>
            <div className="text-xs text-gray-500">{record.customerPhone || ''}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 130,
      align: 'center',
      render: (rating) => (
        <div>
          <Rate disabled value={rating} style={{ fontSize: 14 }} />
          <div className="text-xs font-semibold">{rating}/5</div>
        </div>
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-gray-600">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isHidden',
      key: 'isHidden',
      width: 110,
      render: (isHidden) => (
        <Tag color={isHidden ? 'red' : 'green'}>{isHidden ? 'Đã ẩn' : 'Hiển thị'}</Tag>
      ),
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => date ? format(new Date(date), 'dd/MM/yyyy', { locale: vi }) : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
          <Tooltip title="Phản hồi">
            <Button type="text" icon={<MessageOutlined />} onClick={() => handleOpenReply(record)} style={{ color: '#6366f1' }} />
          </Tooltip>
          <Tooltip title={record.isHidden ? 'Hiện feedback' : 'Ẩn feedback'}>
            <Button
              type="text"
              icon={record.isHidden ? <CheckCircleOutlined /> : <StopOutlined />}
              onClick={() => handleToggleStatus(record)}
              style={{ color: record.isHidden ? '#10b981' : '#f59e0b' }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <Title level={3} style={{ margin: 0 }}>Phản hồi khách hàng</Title>
        <Text type="secondary">Quản lý và theo dõi đánh giá từ khách hàng</Text>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tổng feedback" value={total} prefix={<MessageOutlined style={{ color: '#6366F1' }} />} valueStyle={{ color: '#6366F1' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Đánh giá TB (trang này)" value={avgRating} suffix="/ 5" prefix={<StarFilled style={{ color: '#F59E0B' }} />} valueStyle={{ color: '#F59E0B' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tỷ lệ hài lòng (≥4★)" value={satisfactionRate} suffix="%" prefix={<SmileOutlined style={{ color: '#8B5CF6' }} />} valueStyle={{ color: '#8B5CF6' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm theo khách hàng, nội dung..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Lọc theo sao"
              style={{ width: 150 }}
              allowClear
              value={ratingFilter}
              onChange={v => { setRatingFilter(v); fetchFeedbacks(1, searchQuery, v); }}
            >
              {[5, 4, 3, 2, 1].map(s => (
                <Option key={s} value={s}>{s} ⭐</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Tìm kiếm</Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm mới</Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={feedbacks}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: t => `Tổng ${t} feedback`,
            onChange: page => fetchFeedbacks(page),
          }}
          locale={{ emptyText: <Empty description="Không có feedback nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết phản hồi"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="reply" type="primary" icon={<MessageOutlined />} onClick={() => { setIsDetailModalOpen(false); handleOpenReply(selectedFeedback); }}>
            Phản hồi
          </Button>,
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>,
        ]}
        width={640}
      >
        {selectedFeedback && (
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-900">{selectedFeedback.customerName}</div>
              <div className="text-sm text-gray-500">{selectedFeedback.customerPhone}</div>
            </div>
            <div>
              <Rate disabled value={selectedFeedback.rating} />
              <span className="ml-2 font-semibold">{selectedFeedback.rating}/5</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">💬 Nội dung:</div>
              <div className="text-gray-900">{selectedFeedback.content}</div>
            </div>
            {selectedFeedback.replyContent && (
              <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
                <div className="text-sm font-semibold text-indigo-700 mb-1">✉️ Phản hồi của cửa hàng:</div>
                <div className="text-gray-800">{selectedFeedback.replyContent}</div>
              </div>
            )}
            {selectedFeedback.imageUrls?.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2">📷 Hình ảnh:</div>
                <Image.PreviewGroup>
                  <Space wrap>
                    {selectedFeedback.imageUrls.map((img, i) => (
                      <Image key={i} src={img} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 6 }} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal
        title="Phản hồi feedback"
        open={isReplyModalOpen}
        onOk={handleReply}
        onCancel={() => setIsReplyModalOpen(false)}
        okText="Gửi phản hồi"
        cancelText="Hủy"
        confirmLoading={replying}
      >
        <div className="mt-4">
          {selectedFeedback && (
            <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-700">
              <Rate disabled value={selectedFeedback.rating} style={{ fontSize: 14 }} />
              <div className="mt-1">{selectedFeedback.content}</div>
            </div>
          )}
          <TextArea
            rows={5}
            placeholder="Nhập nội dung phản hồi..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default FeedbackList;
