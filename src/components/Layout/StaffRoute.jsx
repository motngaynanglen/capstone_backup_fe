import React from 'react';
import StaffLayout from './StaffLayout';
import PrivateRoute from '../../routes/PrivateRoute';

/** Layout + auth chuẩn cho mọi trang KTV. */
export default function StaffRoute({ children }) {
  return (
    <StaffLayout>
      <PrivateRoute requiredRole={['employee', 'staff']}>{children}</PrivateRoute>
    </StaffLayout>
  );
}
