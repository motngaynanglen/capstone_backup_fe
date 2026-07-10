import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TemplateFormModal from "../../components/Staff/TemplateFormModal";

/**
 * Trang wrapper cho deep-link /staff/templates/create và /staff/templates/:id/edit
 * — mở modal ngay trên nền danh sách.
 */
const StaffTemplateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [id]);

  const handleClose = () => {
    setOpen(false);
    if (id) {
      navigate(`/staff/templates/${id}`);
    } else {
      navigate("/staff/templates");
    }
  };

  const handleSuccess = (savedId, isEdit) => {
    if (isEdit && id) {
      navigate(`/staff/templates/${id}`);
    } else if (savedId) {
      navigate(`/staff/templates/${savedId}`);
    } else {
      navigate("/staff/templates");
    }
  };

  return (
    <TemplateFormModal
      open={open}
      templateId={id || null}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
};

export default StaffTemplateEdit;
