import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ManagerLayout from '../components/Layout/ManagerLayout';
import DashboardLayout from '../components/Layout/DashboardLayout';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { useAuthModal } from '../contexts/AuthModalContext';
import AuthModal from '../components/Auth/AuthModal';
import ScrollToTop from '../components/Common/ScrollToTop';

// General Pages
import Home from '../pages/Home';
import ProductCatalog from '../pages/ProductCatalog';
import ProductDetail from '../pages/ProductDetail';
import ShoppingCart from '../pages/ShoppingCart';
import Checkout from '../pages/Checkout';
import OrderConfirmation from '../pages/OrderConfirmation';
import MyOrders from '../pages/MyOrders';
import OrderDetail from '../pages/OrderDetail';

// Customer Pages
import UserProfilePage from "../pages/Customer/UserProfilePage";
import CustomOrderType from "../pages/CustomOrderType";
import CustomOrderUpload from "../pages/CustomOrderUpload";
import CustomOrderRequestDesign from "../pages/CustomOrderRequestDesign";
import CustomOrderAIGenerate from "../pages/CustomOrderAIGenerate";
import CustomOrderReadyPrint from "../pages/CustomOrderReadyPrint";
import MyCustomOrders from "../pages/MyCustomOrders";
import CustomOrderDetail from "../pages/CustomOrderDetail";
import Preview3D from "../pages/Preview3D";
import FeedbackForm from "../pages/FeedbackForm";
import Design3DCustomizer from "../pages/Design3DCustomizer";
import FaqPage from "../pages/info/FaqPage";
import ShippingPolicyPage from "../pages/info/ShippingPolicyPage";
import ContactPage from "../pages/info/ContactPage";

// Dashboard Pages
import DashboardOverview from "../pages/Dashboard/DashboardOverview";

// Staff Pages
import StaffDashboard from "../pages/Staff/StaffDashboard";
import StaffCustomOrdersList from "../pages/Staff/StaffCustomOrdersList";
import StaffCustomOrderDetail from "../pages/Staff/StaffCustomOrderDetail";
import DesignFileUpload from "../pages/Staff/DesignFileUpload";
import StaffCustomItemPrinting from "../pages/Staff/StaffCustomItemPrinting";
import StaffTemplateManagement from "../pages/Staff/StaffTemplateManagement";
import StaffTemplateDetail from "../pages/Staff/StaffTemplateDetail";
import StaffTemplateEdit from "../pages/Staff/StaffTemplateEdit";
import StaffCreateProductionJob from "../pages/Staff/StaffCreateProductionJob";
import StaffProductionQueue from "../pages/Staff/StaffProductionQueue";
import StaffShopOrders from "../pages/Staff/StaffShopOrders";
import StaffRoute from "../components/Layout/StaffRoute";

// Admin Pages
import AdminDashboard from "../pages/Manager/ManagerDashboard";
import ManageProducts from "../pages/Manager/ManageProducts";
import ManageMaterials from "../pages/Manager/ManageMaterials";
import DesignTemplateEditRedirect from "../pages/Manager/DesignTemplateEditRedirect";
import ManageStaffAccounts from "../pages/Manager/ManageStaffAccounts";
import FeedbackList from "../pages/Manager/FeedbackList";
import SystemSettings from "../pages/Manager/SystemSettings";
import ManagerTransactions from "../pages/Manager/ManagerTransactions";
import ManagerTransactionDetail from "../pages/Manager/ManagerTransactionDetail";
import ManageInventory from "../pages/Manager/ManageInventory";
import ManageOrders from "../pages/Manager/ManageOrders";
import ManagerDashboard from '../pages/Manager/ManagerDashboard';

// === IMPORT TỪ TỔNG ĐÀI ADMIN ===
import { ManageUsers, AdminOrderList, AdminOrderDetail, AdminShipmentList, AdminInventory, AdminServices } from "../pages/Admin";

// === IMPORT CỤM AUTH CHUẨN SENIOR ===
import {
  LoginPage,
  RegisterPage,
  AdminLoginPage,
  ForgotPasswordPage,
  ResetPasswordPage
} from "../pages/auth";

// Component để redirect login/register và mở modal
const LoginRedirect = () => {
  const { openModal } = useAuthModal();
  React.useEffect(() => {
    openModal('login');
  }, [openModal]);
  return <Navigate to="/" replace />;
};

const RegisterRedirect = () => {
  const { openModal } = useAuthModal();
  React.useEffect(() => {
    openModal('register');
  }, [openModal]);
  return <Navigate to="/" replace />;
};

const AppRouter = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>

        {/* ========================================== */}
        {/* CỤM ROUTES: AUTHENTICATION (XÁC THỰC)      */}
        {/* ========================================== */}

        {/* Admin Login: Không có Header/Footer */}
        <Route
          path="/admin/login"
          element={
            <PublicRoute>
              <AdminLoginPage />
            </PublicRoute>
          }
        />

        {/* Customer Auth: Bọc trong Layout để có Header/Footer */}
        <Route
          path="/login"
          element={
            <Layout>
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            </Layout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Layout>
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            </Layout>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Layout>
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            </Layout>
          }
        />


        {/* ========================================== */}
        {/* CỤM ROUTES: MANAGER                        */}
        {/* ========================================== */}
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManagerDashboard />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/products"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManageProducts basePath="/manager/products" />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/products/:id"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <StaffTemplateDetail basePath="/manager/products" />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/materials"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManageMaterials />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route path="/manager/design-templates" element={<Navigate to="/manager/products" replace />} />
        <Route path="/manager/design-templates/create" element={<Navigate to="/manager/products?action=create" replace />} />
        <Route
          path="/manager/design-templates/edit/:id"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <DesignTemplateEditRedirect basePath="/manager/products" />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/staff"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManageStaffAccounts />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/feedback"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <FeedbackList />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/transactions"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManagerTransactions />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/transactions/:id"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManagerTransactionDetail />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/inventory"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManageInventory />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/orders"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManageOrders />
              </ManagerLayout>
            </PrivateRoute>
          }
        />

        {/* ========================================== */}
        {/* CỤM ROUTES: STAFF (StaffLayout + JWT)      */}
        {/* ========================================== */}
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff/dashboard" element={<StaffRoute><StaffDashboard /></StaffRoute>} />
        <Route path="/staff/production-queue" element={<StaffRoute><StaffProductionQueue /></StaffRoute>} />
        <Route path="/staff/shop-orders" element={<StaffRoute><StaffShopOrders /></StaffRoute>} />
        <Route path="/staff/custom-orders" element={<StaffRoute><StaffCustomOrdersList /></StaffRoute>} />
        <Route path="/staff/custom-orders/:id" element={<StaffRoute><StaffCustomOrderDetail /></StaffRoute>} />
        <Route
          path="/staff/custom-orders/:orderId/items/:itemId/printing"
          element={<StaffRoute><StaffCustomItemPrinting /></StaffRoute>}
        />
        <Route
          path="/staff/custom-orders-management"
          element={<Navigate to="/staff/shop-orders" replace />}
        />
        <Route
          path="/staff/custom-orders-management/:id"
          element={<Navigate to="/staff/shop-orders" replace />}
        />
        <Route path="/staff/production-jobs/new" element={<StaffRoute><StaffCreateProductionJob /></StaffRoute>} />
        <Route path="/staff/design-reviews" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff/design-reviews/:id" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff/upload-design/:orderId" element={<StaffRoute><DesignFileUpload /></StaffRoute>} />
        <Route path="/staff/templates" element={<StaffRoute><StaffTemplateManagement /></StaffRoute>} />
        <Route path="/staff/templates/create" element={<StaffRoute><StaffTemplateEdit /></StaffRoute>} />
        <Route path="/staff/templates/:id/edit" element={<StaffRoute><StaffTemplateEdit /></StaffRoute>} />
        <Route path="/staff/templates/:id" element={<StaffRoute><StaffTemplateDetail /></StaffRoute>} />

        {/* ========================================== */}
        {/* CỤM ROUTES: ADMIN                          */}
        {/* ========================================== */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="orders" element={<AdminOrderList />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="products" element={<ManageProducts basePath="/admin/products" />} />
          <Route path="products/:id" element={<StaffTemplateDetail basePath="/admin/products" />} />
          <Route path="materials" element={<ManageMaterials />} />
          <Route path="design-templates" element={<Navigate to="/admin/products" replace />} />
          <Route path="design-templates/create" element={<Navigate to="/admin/products?action=create" replace />} />
          <Route path="design-templates/edit/:id" element={<DesignTemplateEditRedirect basePath="/admin/products" />} />
          <Route path="staff" element={<ManageStaffAccounts />} />
          <Route path="shipments" element={<AdminShipmentList />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="feedback" element={<FeedbackList />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>

        {/* ========================================== */}
        {/* CỤM ROUTES: CUSTOMER (PUBLIC & PROTECTED)  */}
        {/* ========================================== */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/products"
          element={
            <Layout>
              <ProductCatalog />
            </Layout>
          }
        />
        <Route
          path="/products/:id"
          element={
            <Layout>
              <ProductDetail />
            </Layout>
          }
        />
        <Route
          path="/faq"
          element={
            <Layout>
              <FaqPage />
            </Layout>
          }
        />
        <Route
          path="/shipping"
          element={
            <Layout>
              <ShippingPolicyPage />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <ContactPage />
            </Layout>
          }
        />

        {/* ===== ĐÃ THÊM ROUTE PROFILE VÀO ĐÂY ===== */}
        <Route
          path="/profile"
          element={
            <Layout>
              <PrivateRoute>
                <UserProfilePage />
              </PrivateRoute>
            </Layout>
          }
        />
        {/* ======================================== */}

        <Route
          path="/cart"
          element={
            <Layout>
              <PrivateRoute>
                <ShoppingCart />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/checkout"
          element={
            <Layout>
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/order-confirmation"
          element={
            <Layout>
              <PrivateRoute>
                <OrderConfirmation />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/my-orders"
          element={
            <Layout>
              <PrivateRoute>
                <MyOrders />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <Layout>
              <PrivateRoute>
                <OrderDetail />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/custom-order"
          element={
            <Layout>
              <PrivateRoute>
                <CustomOrderType />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/custom-order/upload"
          element={
            <Layout>
              <PrivateRoute>
                <CustomOrderUpload />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/custom-order/request-design"
          element={
            <Layout>
              <PrivateRoute>
                <CustomOrderRequestDesign />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/custom-order/ai-generate"
          element={
            <Layout>
              <PrivateRoute>
                <CustomOrderAIGenerate />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/custom-order/ready-print"
          element={
            <Layout>
              <PrivateRoute>
                <CustomOrderReadyPrint />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route path="/custom-order/print-from-design" element={<Navigate to="/custom-order/ready-print" replace />} />
        <Route path="/custom-order/reprint" element={<Navigate to="/custom-order/ready-print" replace />} />
        <Route
          path="/my-custom-orders"
          element={
            <Layout>
              <PrivateRoute>
                <MyCustomOrders />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/custom-orders/:id"
          element={
            <Layout>
              <PrivateRoute>
                <CustomOrderDetail />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/preview/:id"
          element={
            <Layout>
              <PrivateRoute>
                <Preview3D />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/feedback/:orderId"
          element={<FeedbackForm />}
        />
        <Route
          path="/design-customizer"
          element={
            <PrivateRoute>
              <Design3DCustomizer />
            </PrivateRoute>
          }
        />
      </Routes>
      <AuthModal />
    </Router>
  );
};

export default AppRouter;