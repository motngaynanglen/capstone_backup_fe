import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Divider, message, Spin, Typography } from "antd";
import designVariantApi from "../../api/designVariantApi";
import inventoryApi from "../../api/inventoryApi";
import materialApi from "../../api/materialApi";
import ProductFileUpload from "../Manager/ProductFileUpload";
import { fileLabel } from "../../utils/variantMedia";

const { Text } = Typography;

const STOCK_ADJUST_NONE = "NONE";

const VariantFormModal = ({ open, templateId, variant, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [previewModelUrl, setPreviewModelUrl] = useState("");
  const [previewModelFileName, setPreviewModelFileName] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewImageFileName, setPreviewImageFileName] = useState("");
  const isEditMode = Boolean(variant?.id);
  const watchedStockAction = Form.useWatch("stockAdjustAction", form);

  useEffect(() => {
    if (!open) return;

    const init = async () => {
      setLoading(true);
      try {
        const matRes = await materialApi.getAll();
        setMaterials(matRes.data || []);

        form.resetFields();
        setPreviewModelUrl("");
        setPreviewModelFileName("");
        setPreviewImageUrl("");
        setPreviewImageFileName("");

        if (variant) {
          form.setFieldsValue({
            code: variant.code,
            name: variant.name,
            materialId: variant.materialId,
            price: variant.price,
            sizeScale: variant.sizeScale ?? 1,
            estimatedWeightPerUnit: variant.estimatedWeightPerUnit ?? 0,
            estimatedPrintTimePerUnit: variant.estimatedPrintTimePerUnit ?? 0,
            isAllowPreOrder: variant.isAllowPreOrder ?? true,
            stockAdjustAction: STOCK_ADJUST_NONE,
            stockAdjustQuantity: undefined,
            stockAdjustNote: "",
          });
          if (variant.previewModelUrl) {
            setPreviewModelUrl(variant.previewModelUrl);
            setPreviewModelFileName(fileLabel(variant.previewModelUrl));
          }
          if (variant.previewImageUrl) {
            setPreviewImageUrl(variant.previewImageUrl);
            setPreviewImageFileName(fileLabel(variant.previewImageUrl));
          }
        } else {
          form.setFieldsValue({
            initialStockQuantity: 1,
            sizeScale: 1,
            estimatedWeightPerUnit: 50,
            estimatedPrintTimePerUnit: 60,
            isAllowPreOrder: true,
          });
        }
      } catch (error) {
        message.error("Không thể tải dữ liệu biến thể");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [open, variant, form, onClose]);

  const createInventoryAdjustment = async (variantId, action, quantity, note) => {
    const signedQuantity = action === "OUT" ? -quantity : quantity;
    const type = action === "OUT" ? "ADJUSTMENT" : "PRODUCTION_IN";
    await inventoryApi.create({
      designVariantId: variantId,
      type,
      quantity: signedQuantity,
      note: note?.trim() || (action === "IN" ? "Nhập kho khi cập nhật biến thể" : "Xuất kho khi cập nhật biến thể"),
    });
  };

  const confirmStockAdjustment = (currentStock, action, quantity, variantName) =>
    new Promise((resolve) => {
      const isInbound = action === "IN";
      const nextStock = currentStock + (isInbound ? quantity : -quantity);

      Modal.confirm({
        title: "Xác nhận điều chỉnh kho",
        okText: "Xác nhận",
        cancelText: "Hủy",
        content: (
          <div className="space-y-1 pt-1">
            <p><Text strong>Biến thể:</Text> {variantName}</p>
            <p><Text strong>Tồn hiện tại:</Text> {currentStock} sp</p>
            <p>
              <Text strong>{isInbound ? "Nhập kho" : "Xuất kho"}:</Text>{" "}
              <Text type={isInbound ? "success" : "danger"}>{quantity} sp</Text>
            </p>
            <p><Text strong>Tồn sau điều chỉnh:</Text> {nextStock} sp</p>
            <Text type="secondary" className="text-xs">
              Giao dịch sẽ được ghi vào Quản lý kho.
            </Text>
          </div>
        ),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  const handleSubmit = async () => {
    if (!templateId) {
      message.warning("Thiếu mã mẫu thiết kế");
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const mediaFields = {
        previewModelUrl: previewModelUrl?.trim() || null,
        previewImageUrl: previewImageUrl?.trim() || null,
      };

      if (isEditMode) {
        const stockAction = values.stockAdjustAction || STOCK_ADJUST_NONE;
        const adjustQty = Number(values.stockAdjustQuantity) || 0;
        const currentStock = variant.stockQuantity ?? 0;

        if (stockAction !== STOCK_ADJUST_NONE) {
          if (!adjustQty || adjustQty <= 0) {
            message.warning("Vui lòng nhập số lượng điều chỉnh kho lớn hơn 0");
            setSubmitting(false);
            return;
          }
          if (stockAction === "OUT" && adjustQty > currentStock) {
            message.warning(`Không thể xuất quá tồn kho hiện tại (${currentStock} sp)`);
            setSubmitting(false);
            return;
          }

          const confirmed = await confirmStockAdjustment(
            currentStock,
            stockAction,
            adjustQty,
            values.name?.trim() || variant.name,
          );
          if (!confirmed) {
            setSubmitting(false);
            return;
          }
        }

        const payload = {
          id: variant.id,
          materialId: values.materialId,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          sizeScale: values.sizeScale ?? 1,
          price: values.price ?? 0,
          isAllowPreOrder: values.isAllowPreOrder ?? true,
          estimatedWeightPerUnit: values.estimatedWeightPerUnit ?? 0,
          estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit ?? 0,
          ...mediaFields,
          clearPreviewOverride: !previewModelUrl?.trim(),
          clearPreviewImageOverride: !previewImageUrl?.trim(),
        };
        const response = await designVariantApi.update(payload);
        if (response.code && response.code !== "SUCCESS") {
          throw new Error(response.message);
        }

        if (stockAction !== STOCK_ADJUST_NONE && adjustQty > 0) {
          await createInventoryAdjustment(
            variant.id,
            stockAction,
            adjustQty,
            values.stockAdjustNote,
          );
          message.success("Cập nhật biến thể và điều chỉnh kho thành công");
        } else {
          message.success("Cập nhật biến thể thành công");
        }
      } else {
        const initialStock = Number(values.initialStockQuantity) || 0;
        if (initialStock < 1) {
          message.warning("Vui lòng nhập số lượng nhập kho ban đầu (ít nhất 1)");
          setSubmitting(false);
          return;
        }

        const payload = {
          designTemplateId: templateId,
          materialId: values.materialId,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          sizeScale: values.sizeScale ?? 1,
          stockQuantity: initialStock,
          price: values.price ?? 0,
          isAllowPreOrder: values.isAllowPreOrder ?? true,
          estimatedWeightPerUnit: values.estimatedWeightPerUnit ?? 0,
          estimatedPrintTimePerUnit: values.estimatedPrintTimePerUnit ?? 0,
          ...mediaFields,
        };
        const response = await designVariantApi.add(payload);
        if (response.code && response.code !== "SUCCESS") {
          throw new Error(response.message);
        }
        message.success("Thêm biến thể và nhập kho ban đầu thành công");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || error.message || "Lưu biến thể thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? "Chỉnh sửa biến thể" : "Thêm biến thể mới"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditMode ? "Lưu" : "Thêm biến thể"}
      cancelText="Hủy"
      confirmLoading={submitting}
      width={640}
      destroyOnClose
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark="optional">
          <Divider orientation="left" plain style={{ marginTop: 0 }}>
            Thông tin biến thể
          </Divider>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="code"
              label="Mã biến thể"
              rules={[{ required: true, message: "Nhập mã biến thể" }]}
            >
              <Input
                placeholder="VD: FIG-001-A"
                style={{ textTransform: "uppercase" }}
                onChange={(e) => form.setFieldValue("code", e.target.value.toUpperCase())}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên biến thể"
              rules={[{ required: true, message: "Nhập tên biến thể" }]}
            >
              <Input placeholder="Tên hiển thị" />
            </Form.Item>
          </div>

          <Form.Item
            name="materialId"
            label="Vật liệu in"
            rules={[{ required: true, message: "Chọn vật liệu" }]}
          >
            <Select
              placeholder="Chọn vật liệu..."
              showSearch
              optionFilterProp="label"
              options={materials.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>

          <Divider orientation="left" plain>
            Giá & tồn kho
          </Divider>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="price"
              label="Giá bán (đ)"
              rules={[{ required: true, message: "Nhập giá" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                step={1000}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/,/g, "")}
                placeholder="150000"
              />
            </Form.Item>

            {isEditMode ? (
              <Form.Item label="Tồn kho hiện tại">
                <InputNumber
                  className="w-full"
                  value={variant?.stockQuantity ?? 0}
                  disabled
                  addonAfter="sp"
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="initialStockQuantity"
                label="Số lượng nhập kho ban đầu"
                rules={[{ required: true, message: "Nhập số lượng nhập kho" }]}
                extra="Bắt buộc — sẽ tạo giao dịch nhập sản xuất trong Quản lý kho"
              >
                <InputNumber className="w-full" min={1} placeholder="VD: 10" />
              </Form.Item>
            )}
          </div>

          {isEditMode && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
              <Text strong className="block mb-3">Điều chỉnh tồn kho (tuỳ chọn)</Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item name="stockAdjustAction" label="Loại điều chỉnh" initialValue={STOCK_ADJUST_NONE}>
                  <Select
                    options={[
                      { value: STOCK_ADJUST_NONE, label: "Không thay đổi tồn kho" },
                      { value: "IN", label: "Nhập kho (+)" },
                      { value: "OUT", label: "Xuất kho (−)" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="stockAdjustQuantity"
                  label="Số lượng"
                  rules={
                    watchedStockAction && watchedStockAction !== STOCK_ADJUST_NONE
                      ? [{ required: true, message: "Nhập số lượng" }]
                      : []
                  }
                >
                  <InputNumber
                    className="w-full"
                    min={1}
                    disabled={!watchedStockAction || watchedStockAction === STOCK_ADJUST_NONE}
                    placeholder="VD: 5"
                  />
                </Form.Item>
              </div>
              <Form.Item name="stockAdjustNote" label="Ghi chú điều chỉnh kho">
                <Input.TextArea
                  rows={2}
                  disabled={!watchedStockAction || watchedStockAction === STOCK_ADJUST_NONE}
                  placeholder="Lý do nhập/xuất kho..."
                />
              </Form.Item>
            </div>
          )}

          <Form.Item
            name="isAllowPreOrder"
            label="Cho phép đặt trước khi hết hàng"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left" plain>
            Thông số kỹ thuật
          </Divider>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
            <Form.Item name="sizeScale" label="Tỷ lệ kích thước">
              <InputNumber className="w-full" min={0.1} step={0.1} placeholder="1.0" />
            </Form.Item>

            <Form.Item name="estimatedWeightPerUnit" label="Khối lượng (g)">
              <InputNumber className="w-full" min={0} placeholder="50" />
            </Form.Item>

            <Form.Item name="estimatedPrintTimePerUnit" label="Thời gian in (phút)">
              <InputNumber className="w-full" min={0} placeholder="60" />
            </Form.Item>
          </div>

          <Divider orientation="left" plain>
            File & hình ảnh riêng
          </Divider>

          <ProductFileUpload
            label="File GLB riêng (tuỳ chọn)"
            hint="Để trống sẽ dùng file GLB của mẫu gốc."
            accept=".glb,model/gltf-binary"
            allowedLabel=".glb"
            previewType="model"
            value={previewModelUrl}
            fileName={previewModelFileName}
            onChange={(url, name) => {
              setPreviewModelUrl(url || "");
              setPreviewModelFileName(name || "");
            }}
            className="mb-4"
          />

          <ProductFileUpload
            label="Ảnh đại diện riêng (tuỳ chọn)"
            hint="Để trống sẽ dùng ảnh thumbnail của mẫu gốc."
            accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
            allowedLabel=".png, .jpg, .webp"
            previewType="image"
            value={previewImageUrl}
            fileName={previewImageFileName}
            onChange={(url, name) => {
              setPreviewImageUrl(url || "");
              setPreviewImageFileName(name || "");
            }}
            className="mb-4"
          />
        </Form>
      )}
    </Modal>
  );
};

export default VariantFormModal;
