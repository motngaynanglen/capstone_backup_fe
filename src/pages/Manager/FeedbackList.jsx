import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table, Input, Select, Button, Modal, Avatar, Rate, Tag, Space, Card, Row, Col,
  Empty, Tooltip, Image, Typography, message, Popover, Descriptions, Badge, Divider,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, MessageOutlined, DeleteOutlined, StarFilled,
  ReloadOutlined, StopOutlined, CheckCircleOutlined, SmileOutlined, UserOutlined,
  TeamOutlined, ClockCircleOutlined, FilterOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import feedbackApi from '../../api/feedbackApi';
import { useAuth } from '../../contexts/AuthContext';
import { isCustomPrintSourceType } from '../../api/mainflow2Api';

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;
const { Title, Text, Paragraph } = Typography;

const REPLY_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ phản hồi' },
  { value: 'replied', label: 'Đã phản hồi' },
];

const QUICK_FILTERS = [
  { key: 'all', reply: '', hidden: null, label: 'Tất cả' },
  { key: 'pending', reply: 'pending', hidden: null, label: 'Chờ phản hồi' },
  { key: 'replied', reply: 'replied', hidden: null, label: 'Đã phản hồi' },
  { key: 'hidden', reply: '', hidden: true, label: 'Đã ẩn' },
];

const SOURCE_TYPE_LABELS = {
  IN_STOCK: 'Sẵn hàng',
  PRE_ORDER: 'Đặt trước',
  CUSTOM_FILE_PRINT_MF2: 'In từ file',
  CUSTOM_QUOTE_MF2: 'Thiết kế tùy chỉnh',
  AI_GENERATED: 'AI sinh mô hình',
  PRINT_FROM_DESIGN_MF2: 'In từ thiết kế',
  REPRINT_MF2: 'In lại',
  ORDER: 'Đặt hàng',
};

const SOURCE_TYPE_COLORS = {
  IN_STOCK: 'blue',
  PRE_ORDER: 'purple',
  CUSTOM_FILE_PRINT_MF2: 'cyan',
  CUSTOM_QUOTE_MF2: 'geekblue',
  AI_GENERATED: 'magenta',
  PRINT_FROM_DESIGN_MF2: 'volcano',
  REPRINT_MF2: 'orange',
};

const getCustomerName = (record) => record.customerRealName || record.customerFullName || '—';

const getSourceTypeLabel = (sourceType) =>
  SOURCE_TYPE_LABELS[String(sourceType || '').toUpperCase()] || sourceType || '—';

const getSourceTypeColor = (sourceType) =>
  SOURCE_TYPE_COLORS[String(sourceType || '').toUpperCase()] || 'default';

const formatDate = (date) =>
  date ? format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—';

const StatCard = ({ title, value, suffix, icon, color, subtitle }) => (
  <Card
    bordered={false}
    className="shadow-sm"
    styles={{ body: { padding: '16px 20px' } }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Text type="secondary" className="text-xs uppercase tracking-wide">
          {title}
        </Text>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color }}>
            {value}
          </span>
          {suffix && (
            <span className="text-sm font-medium text-gray-400">{suffix}</span>
          )}
        </div>
        {subtitle && (
          <Text type="secondary" className="text-xs mt-1 block">
            {subtitle}
          </Text>
        )}
      </div>
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {icon}
      </div>
    </div>
  </Card>
);

const FeedbackList = () => {
  const { user } = useAuth();
  const canReply = ['manager', 'admin'].includes((user?.role || '').toLowerCase());

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [replyFilter, setReplyFilter] = useState('');
  const [hiddenFilter, setHiddenFilter] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildQueryParams = useCallback((page, search, rating, reply, hidden) => {
    const params = {
      pageNumber: page,
      pageSize: pagination.pageSize,
    };
    if (search) params.search = search;
    if (rating) params.rating = rating;
    if (hidden !== null && hidden !== undefined) params.isHidden = hidden;
    if (reply === 'pending') params.hasStaffReply = false;
    if (reply === 'replied') params.hasStaffReply = true;
    return params;
  }, [pagination.pageSize]);

  const fetchFeedbacks = useCallback(async (
    page = 1,
    search = debouncedSearch,
    rating = ratingFilter,
    reply = replyFilter,
    hidden = hiddenFilter,
  ) => {
    setLoading(true);
    try {
      const res = await feedbackApi.query(buildQueryParams(page, search, rating, reply, hidden));
      const list = res?.data || [];
      setFeedbacks(list);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: res?.additionalData?.paging?.totalCount || list.length,
      }));
    } catch {
      message.error('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, debouncedSearch, ratingFilter, replyFilter, hiddenFilter]);

  useEffect(() => {
    fetchFeedbacks(1);
  }, [debouncedSearch, ratingFilter, replyFilter, hiddenFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setRatingFilter(null);
    setReplyFilter('');
    setHiddenFilter(null);
    setQuickFilter('all');
  };

  const applyQuickFilter = (filter) => {
    setQuickFilter(filter.key);
    setReplyFilter(filter.reply);
    setHiddenFilter(filter.hidden);
  };

  const handleViewDetails = (record) => {
    setSelectedFeedback(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenReply = (record) => {
    setSelectedFeedback(record);
    setReplyText(record.staffReply || '');
    setIsReplyModalOpen(true);
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      message.warning('Vui lòng nhập nội dung phản hồi');
      return;
    }
    setReplying(true);
    try {
      await feedbackApi.reply(selectedFeedback.id, replyText.trim());
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
      message.success(record.isHidden ? 'Đã hiện phản hồi' : 'Đã ẩn phản hồi');
      fetchFeedbacks(pagination.current);
    } catch {
      message.error('Thao tác thất bại');
    }
  };

  const handleDelete = (record) => {
    confirm({
      title: 'Xóa phản hồi này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await feedbackApi.delete(record.id);
          message.success('Đã xóa phản hồi');
          fetchFeedbacks(pagination.current);
        } catch (err) {
          message.error(err?.response?.data?.message || 'Xóa thất bại');
        }
      },
    });
  };

  const pageStats = useMemo(() => {
    if (!feedbacks.length) return { avgRating: 0, satisfactionRate: 0, pendingCount: 0 };
    const avgRating = feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length;
    const satisfactionRate = (feedbacks.filter((f) => f.rating >= 4).length / feedbacks.length) * 100;
    const pendingCount = feedbacks.filter((f) => !f.staffReply?.trim()).length;
    return { avgRating, satisfactionRate, pendingCount };
  }, [feedbacks]);

  const hasActiveFilters = Boolean(
    debouncedSearch || ratingFilter || replyFilter || hiddenFilter !== null,
  );

  const renderAssignedStaff = (record) => {
    const showStaffInfo = record.hasAssignedStaffInfo
      || isCustomPrintSourceType(record.orderItemSourceType);

    if (!showStaffInfo) return null;

    if (record.assignedStaffName) {
      return (
        <Popover
          title="Nhân viên đảm nhiệm"
          content={(
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Họ tên">{record.assignedStaffName}</Descriptions.Item>
              <Descriptions.Item label="Loại đơn">{getSourceTypeLabel(record.orderItemSourceType)}</Descriptions.Item>
            </Descriptions>
          )}
        >
          <Tag icon={<TeamOutlined />} className="cursor-pointer">
            {record.assignedStaffName}
          </Tag>
        </Popover>
      );
    }

    return (
      <Tooltip title="Đơn thiết kế/in — chưa gán nhân viên">
        <Tag color="default">Chưa gán NV</Tag>
      </Tooltip>
    );
  };

  const renderStatusTags = (record) => {
    const hasReply = Boolean(record.staffReply?.trim());
    return (
      <Space direction="vertical" size={4}>
        {hasReply ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Đã trả lời</Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ phản hồi</Tag>
        )}
        {record.isHidden && <Tag color="error">Đã ẩn</Tag>}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Khách hàng & sản phẩm',
      key: 'customer',
      width: 260,
      render: (_, record) => (
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            icon={<UserOutlined />}
            size={36}
            className="shrink-0 bg-indigo-100 text-indigo-600"
          />
          <div className="min-w-0 flex-1">
            <Text strong className="block truncate">{getCustomerName(record)}</Text>
            <Tooltip title={record.orderItemName || record.designTemplateName}>
              <Text type="secondary" className="text-xs block truncate">
                {record.orderItemName || record.designTemplateName || '—'}
              </Text>
            </Tooltip>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {record.orderItemSourceType && (
                <Tag
                  color={getSourceTypeColor(record.orderItemSourceType)}
                  className="text-xs m-0"
                >
                  {getSourceTypeLabel(record.orderItemSourceType)}
                </Tag>
              )}
              {renderAssignedStaff(record)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      width: 280,
      render: (_, record) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Rate disabled value={record.rating} style={{ fontSize: 13 }} />
            <Text strong className="text-sm">{record.rating}/5</Text>
          </div>
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2, tooltip: record.comment }}
            className="!mb-0 text-sm"
          >
            {record.comment || '—'}
          </Paragraph>
          {record.imageUrls?.length > 0 && (
            <Text type="secondary" className="text-xs">
              📷 {record.imageUrls.length} ảnh
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => renderStatusTags(record),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created',
      width: 130,
      render: (date) => (
        <Text type="secondary" className="text-xs whitespace-nowrap">
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => {
        const needsReply = !record.staffReply?.trim();
        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            {canReply && (
              <Tooltip title={needsReply ? 'Trả lời ngay' : 'Sửa phản hồi'}>
                <Badge dot={needsReply} offset={[-2, 2]}>
                  <Button
                    type="text"
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={() => handleOpenReply(record)}
                    style={{ color: needsReply ? '#6366f1' : undefined }}
                  />
                </Badge>
              </Tooltip>
            )}
            <Tooltip title={record.isHidden ? 'Hiện phản hồi' : 'Ẩn phản hồi'}>
              <Button
                type="text"
                size="small"
                icon={record.isHidden ? <CheckCircleOutlined /> : <StopOutlined />}
                onClick={() => handleToggleStatus(record)}
                style={{ color: record.isHidden ? '#10b981' : '#f59e0b' }}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý phản hồi</Title>
          <Text type="secondary">Theo dõi đánh giá, trả lời và kiểm duyệt phản hồi khách hàng</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchFeedbacks(pagination.current)}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <StatCard
            title="Tổng phản hồi"
            value={pagination.total}
            icon={<MessageOutlined />}
            color="#6366f1"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="Điểm TB"
            value={pageStats.avgRating.toFixed(1)}
            suffix="/ 5"
            icon={<StarFilled />}
            color="#f59e0b"
            subtitle="Trên trang hiện tại"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="Hài lòng"
            value={Math.round(pageStats.satisfactionRate)}
            suffix="%"
            icon={<SmileOutlined />}
            color="#8b5cf6"
            subtitle="Đánh giá ≥ 4 sao"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="Chờ xử lý"
            value={pageStats.pendingCount}
            icon={<ClockCircleOutlined />}
            color="#d97706"
            subtitle="Chưa trả lời (trang này)"
          />
        </Col>
      </Row>

      <Card bordered={false} className="shadow-sm" styles={{ body: { padding: 16 } }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_FILTERS.map((filter) => (
            <Button
              key={filter.key}
              type={quickFilter === filter.key ? 'primary' : 'default'}
              size="small"
              onClick={() => applyQuickFilter(filter)}
              className="rounded-full"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} lg={10}>
            <Input
              placeholder="Tìm khách hàng, sản phẩm, nội dung..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={8} lg={4}>
            <Select
              placeholder="Số sao"
              style={{ width: '100%' }}
              allowClear
              value={ratingFilter}
              onChange={(v) => setRatingFilter(v ?? null)}
            >
              {[5, 4, 3, 2, 1].map((s) => (
                <Option key={s} value={s}>{s} sao</Option>
              ))}
            </Select>
          </Col>
          <Col xs={8} lg={4}>
            <Select
              style={{ width: '100%' }}
              value={replyFilter}
              onChange={(v) => {
                setReplyFilter(v);
                const matched = QUICK_FILTERS.find((f) => f.reply === v && f.hidden === hiddenFilter);
                setQuickFilter(matched?.key || 'custom');
              }}
              options={REPLY_FILTER_OPTIONS}
            />
          </Col>
          <Col xs={8} lg={4}>
            <Select
              placeholder="Hiển thị"
              style={{ width: '100%' }}
              allowClear
              value={hiddenFilter}
              onChange={(v) => {
                setHiddenFilter(v ?? null);
                const matched = QUICK_FILTERS.find((f) => f.hidden === (v ?? null) && f.reply === replyFilter);
                setQuickFilter(matched?.key || 'custom');
              }}
              options={[
                { value: false, label: 'Đang hiển thị' },
                { value: true, label: 'Đã ẩn' },
              ]}
            />
          </Col>
          <Col xs={24} lg={2}>
            {hasActiveFilters && (
              <Button block icon={<FilterOutlined />} onClick={handleReset}>
                Xóa lọc
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={feedbacks}
          loading={loading}
          size="middle"
          scroll={{ x: 960 }}
          rowClassName={(record) =>
            !record.staffReply?.trim() && !record.isHidden ? 'bg-amber-50/60' : ''
          }
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (t) => `Tổng ${t} phản hồi`,
            onChange: (page) => fetchFeedbacks(page),
          }}
          locale={{
            emptyText: (
              <Empty
                description={hasActiveFilters ? 'Không tìm thấy phản hồi phù hợp' : 'Chưa có phản hồi nào'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      <Modal
        title="Chi tiết phản hồi"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          canReply && (
            <Button
              key="reply"
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => {
                setIsDetailModalOpen(false);
                handleOpenReply(selectedFeedback);
              }}
            >
              {selectedFeedback?.staffReply ? 'Sửa phản hồi' : 'Trả lời'}
            </Button>
          ),
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>,
        ].filter(Boolean)}
        width={600}
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Avatar icon={<UserOutlined />} size={44} className="bg-indigo-100 text-indigo-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <Text strong className="text-base block">{getCustomerName(selectedFeedback)}</Text>
                <Text type="secondary" className="text-sm block mt-0.5">
                  {selectedFeedback.orderItemName || selectedFeedback.designTemplateName || '—'}
                </Text>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedFeedback.orderItemSourceType && (
                    <Tag color={getSourceTypeColor(selectedFeedback.orderItemSourceType)}>
                      {getSourceTypeLabel(selectedFeedback.orderItemSourceType)}
                    </Tag>
                  )}
                  <Text type="secondary" className="text-xs">{formatDate(selectedFeedback.created)}</Text>
                </div>
              </div>
            </div>

            {(selectedFeedback.hasAssignedStaffInfo
              || isCustomPrintSourceType(selectedFeedback.orderItemSourceType)) && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl">
                <TeamOutlined className="text-blue-600" />
                <div>
                  <Text type="secondary" className="text-xs block">Nhân viên đảm nhiệm</Text>
                  <Text strong>{selectedFeedback.assignedStaffName || 'Chưa gán nhân viên'}</Text>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Rate disabled value={selectedFeedback.rating} />
              <Text strong>{selectedFeedback.rating}/5</Text>
              {renderStatusTags(selectedFeedback)}
            </div>

            <Divider className="!my-3" />

            <div>
              <Text type="secondary" className="text-xs uppercase tracking-wide block mb-1">
                Nội dung khách hàng
              </Text>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {selectedFeedback.comment || '—'}
              </div>
            </div>

            {selectedFeedback.staffReply && (
              <div>
                <Text type="secondary" className="text-xs uppercase tracking-wide block mb-1">
                  Phản hồi cửa hàng
                </Text>
                <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400 text-gray-800">
                  {selectedFeedback.staffReply}
                </div>
              </div>
            )}

            {selectedFeedback.imageUrls?.length > 0 && (
              <div>
                <Text type="secondary" className="text-xs uppercase tracking-wide block mb-2">
                  Hình ảnh đính kèm ({selectedFeedback.imageUrls.length})
                </Text>
                <Image.PreviewGroup>
                  <Space wrap>
                    {selectedFeedback.imageUrls.map((img, i) => (
                      <Image
                        key={i}
                        src={img}
                        width={88}
                        height={88}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Trả lời phản hồi khách hàng"
        open={isReplyModalOpen}
        onOk={handleReply}
        onCancel={() => setIsReplyModalOpen(false)}
        okText="Gửi phản hồi"
        cancelText="Hủy"
        confirmLoading={replying}
        width={520}
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Rate disabled value={selectedFeedback.rating} style={{ fontSize: 14 }} />
                <Text strong>{getCustomerName(selectedFeedback)}</Text>
              </div>
              <Text type="secondary" className="text-sm">{selectedFeedback.comment}</Text>
            </div>
            <TextArea
              rows={5}
              placeholder="Nhập nội dung phản hồi cho khách hàng..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              showCount
              maxLength={1000}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackList;
