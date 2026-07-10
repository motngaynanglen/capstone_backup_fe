import React from "react";
import { Typography } from "antd";

/** Giữ file để tránh thiếu module — có thể mở rộng sau. */
export default function StaffWorkbench() {
  return (
    <Typography.Paragraph type="secondary" style={{ padding: 24 }}>
      Staff workbench (legacy slot) — dùng OpsDashboardView + hook useStaffWorkbench.
    </Typography.Paragraph>
  );
}
