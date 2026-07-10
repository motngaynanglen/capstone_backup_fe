import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
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
import MyCustomOrders from "../pages/MyCustomOrders";
import CustomOrderDetail from "../pages/CustomOrderDetail";
import Preview3D from "../pages/Preview3D";
import FeedbackForm from "../pages/FeedbackForm";
import Design3DCustomizer from "../pages/Design3DCustomizer";



// Staff Pages
import StaffDashboard from "../pages/Staff/StaffDashboard";
import StaffCustomOrdersList from "../pages/Staff/StaffCustomOrdersList";
import StaffCustomOrderDetail from "../pages/Staff/StaffCustomOrderDetail";
import DesignFileUpload from "../pages/Staff/DesignFileUpload";
import StaffDesignReviewDetail from "../pages/Staff/StaffDesignReviewDetail";
import StaffDesignReviewsList from "../pages/Staff/StaffDesignReviewsList";
import StaffCustomItemPrinting from "../pages/Staff/StaffCustomItemPrinting";
import StaffTemplateManagement from "../pages/Staff/StaffTemplateManagement";
import StaffTemplateDetail from "../pages/Staff/StaffTemplateDetail";
import StaffCreateProductionJob from "../pages/Staff/StaffCreateProductionJob";
import StaffProductionQueue from "../pages/Staff/StaffProductionQueue";
import StaffShopOrders from "../pages/Staff/StaffShopOrders";
import StaffRoute from "../components/Layout/StaffRoute";

// Auth Pages
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
                <ManageProducts />
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
        <Route
          path="/manager/design-templates"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManageDesignTemplates />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/design-templates/create"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <DesignTemplateEdit />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/design-templates/edit/:id"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <DesignTemplateEdit />
              </ManagerLayout>
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
          path="/manager/invoices"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManagerInvoices />
              </ManagerLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/invoices/:id"
          element={
            <PrivateRoute requiredRole={['manager', 'admin']}>
              <ManagerLayout>
                <ManagerInvoiceDetail />
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
        <Route path="/staff/design-reviews" element={<StaffRoute><StaffDesignReviewsList /></StaffRoute>} />
        <Route path="/staff/design-reviews/:id" element={<StaffRoute><StaffDesignReviewDetail /></StaffRoute>} />
        <Route path="/staff/upload-design/:orderId" element={<StaffRoute><DesignFileUpload /></StaffRoute>} />
        <Route path="/staff/templates" element={<StaffRoute><StaffTemplateManagement /></StaffRoute>} />
        <Route path="/staff/templates/:id" element={<StaffRoute><StaffTemplateDetail /></StaffRoute>} />

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
          path="/profile"
          element={
            <Layout>
              <PrivateRoute>
                <UserProfilePage />
              </PrivateRoute>
            </Layout>
          }
        />

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
          element={
            <Layout>
              <PrivateRoute>
                <FeedbackForm />
              </PrivateRoute>
            </Layout>
          }
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