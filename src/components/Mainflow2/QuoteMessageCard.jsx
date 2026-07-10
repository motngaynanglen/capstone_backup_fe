import React from "react";
import { Card, Button, Typography } from "antd";
import { formatQuotePrice } from "./quoteBreakdownUtils";
import QuoteBreakdownDisplay from "./QuoteBreakdownDisplay";
import GlbPreview from "./GlbPreview";

const { Text } = Typography;

export default function QuoteMessageCard({
  meta,
  staffNote,
  revision,
  showApprove,
  onApprove,
  approveLoading,
}) {
  const priceLabel = formatQuotePrice(meta);
  const previewUrl = meta?.autoPreviewGlbUrl || meta?.AutoPreviewGlbUrl;
  const hasBreakdown = Boolean(meta?.quoteBreakdown || meta?.QuoteBreakdown);

  return (
    <Card
      size="small"
      style={{
        maxWidth: 520,
        borderColor: "#c7d2fe",
        background: "linear-gradient(135deg,#eef2ff,#f5f3ff)",
      }}
      title={
        <span style={{ fontWeight: 700, color: "#3730a3" }}>
          Báo giá thiết kế + in {revision != null ? `(rev. ${revision})` : ""}
        </span>
      }
    >
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 18, color: "#065f46" }}>
          {priceLabel}
        </Text>
      </div>

      {hasBreakdown && <QuoteBreakdownDisplay breakdown={meta} compact />}

      {previewUrl && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 6 }}>
            Xem trước mô hình 3D
          </Text>
          <GlbPreview src={previewUrl} height={220} />
        </div>
      )}

      {staffNote && (
        <Text
          style={{
            display: "block",
            whiteSpace: "pre-wrap",
            marginTop: 12,
            marginBottom: showApprove ? 12 : 0,
          }}
        >
          {staffNote}
        </Text>
      )}
      {showApprove && onApprove && (
        <Button
          type="primary"
          loading={approveLoading}
          onClick={onApprove}
          style={{ background: "#059669", borderColor: "#059669", marginTop: 8 }}
        >
          Duyệt báo giá
        </Button>
      )}
    </Card>
  );
}
