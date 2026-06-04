import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Route dùng cho các trang yêu cầu đăng nhập, có thể kèm role

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading, sessionExpired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          reason: sessionExpired ? "SESSION_EXPIRED" : "LOGIN_REQUIRED",
        }}
      />
    );
  }

  if (requiredRole) {
    const normalizedRole = user?.role?.toLowerCase();

    if (Array.isArray(requiredRole)) {
      const normalizedRequiredRoles = requiredRole.map(r => r.toLowerCase());
      if (!normalizedRequiredRoles.includes(normalizedRole)) {
        return <Navigate to="/" replace />;
      }
    } else {
      if (normalizedRole !== requiredRole.toLowerCase()) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return children;
};

export default PrivateRoute;
