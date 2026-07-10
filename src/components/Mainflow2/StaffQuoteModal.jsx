import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import Mainflow2QuoteBuilder from "./Mainflow2QuoteBuilder";

/**
 * Modal báo giá chi tiết: chọn vật liệu, khối lượng (gram), nhân đơn giá + tiền công.
 */
export default function StaffQuoteModal({
  open,
  onClose,
  onSubmit,
  submitting,
  designWorkTitle,
}) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (open) setKey((k) => k + 1);
  }, [open]);

  return (
    <Modal
      title={designWorkTitle ? `Báo giá chi tiết — ${designWorkTitle}` : "Báo giá chi tiết"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={760}
      styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
    >
      <Mainflow2QuoteBuilder
        key={key}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
