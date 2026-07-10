import React, { useRef, useState } from "react";
import { Modal, Button, Input, message, Typography } from "antd";
import { UploadOutlined, FileOutlined } from "@ant-design/icons";
import { uploadFile } from "../../api/mainflow2Api";

const { Text } = Typography;

const extractUploadUrl = (res) => {
  const data = res?.data || res;
  return data?.publicUrl || data?.url || res?.publicUrl || res?.url || null;
};

export default function StaffDesignDeliverableModal({
  open,
  onClose,
  onSubmit,
  submitting,
}) {
  const glbInputRef = useRef(null);
  const [note, setNote] = useState("");
  const [previewGlb, setPreviewGlb] = useState(null);
  const [uploadingGlb, setUploadingGlb] = useState(false);

  const reset = () => {
    setNote("");
    setPreviewGlb(null);
    setUploadingGlb(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleGlbUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith(".glb")) {
      message.warning("Vui lòng chọn file .glb");
      return;
    }
    try {
      setUploadingGlb(true);
      const res = await uploadFile(file);
      const url = extractUploadUrl(res);
      if (!url) {
        message.error("Upload thất bại");
        return;
      }
      setPreviewGlb({ name: file.name, url });
    } catch {
      message.error("Lỗi upload file GLB");
    } finally {
      setUploadingGlb(false);
    }
  };

  const handleSubmit = async () => {
    if (!previewGlb?.url) {
      message.warning("Cần upload file GLB bảng thiết kế");
      return;
    }
    await onSubmit?.({ deliverableFileUrl: previewGlb.url, note: note.trim() || undefined });
    reset();
  };

  return (
    <Modal
      title="Gửi bảng thiết kế"
      open={open}
      onCancel={handleClose}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting || uploadingGlb}
          disabled={uploadingGlb}
          style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
          onClick={handleSubmit}
        >
          Gửi cho khách
        </Button>,
      ]}
      width={520}
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
        Khách đã đặt cọc 30%. Gửi file GLB bảng thiết kế để khách duyệt và hoàn tất thanh toán.
      </Text>

      <label className="text-xs font-semibold text-gray-700 block mb-1">
        File GLB bảng thiết kế <span className="text-red-500">*</span>
      </label>
      <input
        ref={glbInputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleGlbUpload(file);
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Button
          icon={<UploadOutlined />}
          loading={uploadingGlb}
          onClick={() => glbInputRef.current?.click()}
        >
          {previewGlb ? "Đổi file GLB" : "Chọn file GLB"}
        </Button>
        {previewGlb && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#6d28d9",
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              borderRadius: 8,
              padding: "6px 12px",
            }}
          >
            <FileOutlined />
            <span style={{ fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }} title={previewGlb.name}>
              {previewGlb.name}
            </span>
            <Button type="text" size="small" danger onClick={() => setPreviewGlb(null)}>
              Xóa
            </Button>
          </div>
        )}
      </div>

      <label className="text-xs font-semibold text-gray-700 block mb-1">Ghi chú gửi khách</label>
      <Input.TextArea
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Mô tả thay đổi, hướng dẫn duyệt bảng thiết kế..."
      />
    </Modal>
  );
}
