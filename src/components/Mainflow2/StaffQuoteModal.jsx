import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import Mainflow2QuoteBuilder from "./Mainflow2QuoteBuilder";

/**
 * Modal báo giá kỹ thuật (TechnicalDraft).
 * Chọn vật liệu + thông số in → BE tự tính giá.
 */
export default function StaffQuoteModal({
  open,
  onClose,
  onSubmit,
  submitting,
  designWorkTitle,
  designVersionHistoryId,
}) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (open) setKey((k) => k + 1);
  }, [open]);

  return (
    <Modal
      title={designWorkTitle ? `Báo giá kỹ thuật — ${designWorkTitle}` : "Báo giá kỹ thuật"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={640}
      styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
    >
      <Mainflow2QuoteBuilder
        key={key}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
        designVersionHistoryId={designVersionHistoryId}
      />
    </Modal>
  );
}
