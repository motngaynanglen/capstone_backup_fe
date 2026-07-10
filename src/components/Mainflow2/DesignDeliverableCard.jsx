import React from "react";
import { Card, Typography } from "antd";
import GlbPreview from "./GlbPreview";

const { Text } = Typography;

export default function DesignDeliverableCard({ meta, staffNote }) {
  const previewUrl =
    meta?.deliverableFileUrl ||
    meta?.DeliverableFileUrl ||
    meta?.deliverableFileUrls?.[0] ||
    meta?.DeliverableFileUrls?.[0];

  return (
    <Card
      size="small"
      style={{
        maxWidth: 520,
        borderColor: "#ddd6fe",
        background: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
      }}
      title={
        <span style={{ fontWeight: 700, color: "#5b21b6" }}>
          Bảng thiết kế
        </span>
      }
    >
      {previewUrl && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 6 }}>
            Xem trước mô hình 3D
          </Text>
          <GlbPreview src={previewUrl} height={240} />
        </div>
      )}

      {staffNote && (
        <Text style={{ display: "block", whiteSpace: "pre-wrap" }}>
          {staffNote}
        </Text>
      )}

      {!previewUrl && !staffNote && (
        <Text type="secondary">Nhân viên đã gửi bảng thiết kế.</Text>
      )}
    </Card>
  );
}
