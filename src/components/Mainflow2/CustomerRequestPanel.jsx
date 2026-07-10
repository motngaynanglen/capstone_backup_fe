import React from "react";
import { Typography, Image, Space } from "antd";

const { Text, Paragraph } = Typography;

export default function CustomerRequestPanel({ order, compact }) {
  if (!order) return null;

  const brief = order.requirementBrief;
  const urls = order.initialIdeaImageUrls || [];
  const fileUrl = order.customerFileUrl;

  return (
    <div style={{ fontSize: compact ? 12 : 13 }}>
      {brief && (
        <Paragraph style={{ marginBottom: compact ? 6 : 10, whiteSpace: "pre-wrap" }}>
          {brief}
        </Paragraph>
      )}
      {urls.length > 0 && (
        <Space wrap size={8} style={{ marginBottom: fileUrl ? 8 : 0 }}>
          {urls.map((src, i) => (
            <Image key={i} src={src} width={compact ? 72 : 96} style={{ borderRadius: 8 }} />
          ))}
        </Space>
      )}
      {fileUrl && (
        <div>
          <Text type="secondary">{compact ? "File: " : "File đính kèm: "}</Text>
          <a href={fileUrl} target="_blank" rel="noreferrer">
            Tải / mở
          </a>
        </div>
      )}
      {!brief && !urls.length && !fileUrl && (
        <Text type="secondary">Không có mô tả thêm.</Text>
      )}
    </div>
  );
}
