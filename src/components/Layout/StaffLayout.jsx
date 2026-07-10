import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout as AntLayout, message } from "antd";
import { useAuth } from "../../contexts/AuthContext";

const { Sider, Content } = AntLayout;

const MENU = [
  { path: "/staff/dashboard", label: "Bàn làm việc", icon: "📋" },
  { path: "/staff/custom-orders", label: "Thiết kế theo yêu cầu", icon: "💬" },
  { path: "/staff/production-queue", label: "Hàng đợi SX", icon: "🖨️" },
  { path: "/staff/shop-orders", label: "Đơn shop & GHN", icon: "🛒" },
  { path: "/staff/templates", label: "Mẫu thiết kế", icon: "🎨" },
];

const StaffLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    message.success("Đã đăng xuất");
    navigate("/admin/login");
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        width={248}
        theme="light"
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
          zIndex: 1000,
          borderRight: "1px solid #eef0f6",
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 shrink-0">
            <Link to="/" className="no-underline">
              <h1 className="text-lg font-bold text-slate-800 m-0">
                3D Print Shop
              </h1>
              <p className="text-xs text-slate-500 mt-1 mb-0 uppercase tracking-wide">
                Khu vực KTV
              </p>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            {MENU.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== "/staff/dashboard" &&
                  location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg no-underline transition-colors ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 p-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-800 m-0 truncate">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-slate-500 capitalize m-0 mb-3">
              {user?.role}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </Sider>
      <AntLayout
        style={{ marginLeft: 248, minHeight: "100vh", background: "#f4f6fb" }}
      >
        <Content style={{ margin: "20px 16px" }}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default StaffLayout;
