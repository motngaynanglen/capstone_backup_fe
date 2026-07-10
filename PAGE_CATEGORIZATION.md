# Phân Loại Trang Theo Vai Trò và Quyền Truy Cập

## 📋 Tổng Quan

Tài liệu này phân loại tất cả các trang trong ứng dụng theo:
- **Public Pages**: Trang công khai, không cần đăng nhập
- **Customer Pages**: Trang dành cho khách hàng (cần đăng nhập với role = 'customer')
- **Staff Pages**: Trang dành cho nhân viên (cần đăng nhập với role = 'employee')
- **Admin Pages**: Trang dành cho quản trị viên (cần đăng nhập với role = 'admin')

---

## 🌐 PUBLIC PAGES (Không cần đăng nhập)

Các trang này cho phép người dùng xem mà không cần đăng nhập:

### 1. **Home Page** (`/`)
- **Mô tả**: Trang chủ hiển thị sản phẩm nổi bật, danh mục, dịch vụ
- **File**: `src/pages/Home.jsx`
- **Truy cập**: Tất cả người dùng

### 2. **Login** (`/login`)
- **Mô tả**: Trang đăng nhập
- **File**: `src/pages/Login.jsx`
- **Truy cập**: Tất cả người dùng (chưa đăng nhập)

### 3. **Register** (`/register`)
- **Mô tả**: Trang đăng ký tài khoản khách hàng
- **File**: `src/pages/Register.jsx`
- **Truy cập**: Tất cả người dùng (chưa đăng nhập)

### 4. **Forgot Password** (`/forgot-password`)
- **Mô tả**: Trang quên mật khẩu
- **File**: `src/pages/ForgotPassword.jsx`
- **Truy cập**: Tất cả người dùng (chưa đăng nhập)

### 5. **Product Catalog** (`/products`)
- **Mô tả**: Danh sách sản phẩm, có thể xem và lọc
- **File**: `src/pages/ProductCatalog.jsx`
- **Truy cập**: Tất cả người dùng
- **Lưu ý**: Có thể xem, nhưng cần đăng nhập để thêm vào giỏ hàng

### 6. **Product Detail** (`/products/:id`)
- **Mô tả**: Chi tiết sản phẩm
- **File**: `src/pages/ProductDetail.jsx`
- **Truy cập**: Tất cả người dùng
- **Lưu ý**: Có thể xem, nhưng cần đăng nhập để thêm vào giỏ hàng

---

## 👤 CUSTOMER PAGES (Cần đăng nhập với role = 'customer')

Các trang này chỉ dành cho khách hàng đã đăng nhập:

### 1. **Shopping Cart** (`/cart`)
- **Mô tả**: Giỏ hàng của khách hàng
- **File**: `src/pages/ShoppingCart.jsx`
- **Quyền**: Customer only

### 2. **Checkout** (`/checkout`)
- **Mô tả**: Trang thanh toán
- **File**: `src/pages/Checkout.jsx`
- **Quyền**: Customer only

### 3. **Order Confirmation** (`/order-confirmation`)
- **Mô tả**: Xác nhận đơn hàng sau khi thanh toán
- **File**: `src/pages/OrderConfirmation.jsx`
- **Quyền**: Customer only

### 4. **My Orders** (`/my-orders`)
- **Mô tả**: Danh sách đơn hàng của khách hàng (cả sản phẩm và custom orders)
- **File**: `src/pages/MyOrders.jsx`
- **Quyền**: Customer only

### 5. **Order Detail** (`/orders/:id`)
- **Mô tả**: Chi tiết đơn hàng cụ thể
- **File**: `src/pages/OrderDetail.jsx`
- **Quyền**: Customer only

### 6. **Custom Order Type Selection** (`/custom-order`)
- **Mô tả**: Chọn loại custom order (Upload File / Request Design / AI Generate)
- **File**: `src/pages/CustomOrderType.jsx`
- **Quyền**: Customer only

### 7. **Custom Order - Upload File** (`/custom-order/upload`)
- **Mô tả**: Upload file 3D (STL/OBJ) để in
- **File**: `src/pages/CustomOrderUpload.jsx`
- **Quyền**: Customer only

### 8. **Custom Order - Request Design** (`/custom-order/request-design`)
- **Mô tả**: Gửi hình ảnh tham khảo và mô tả để nhân viên thiết kế
- **File**: `src/pages/CustomOrderRequestDesign.jsx`
- **Quyền**: Customer only

### 9. **Custom Order - AI Generate** (`/custom-order/ai-generate`)
- **Mô tả**: Sử dụng AI để tạo mô hình 3D từ hình ảnh
- **File**: `src/pages/CustomOrderAIGenerate.jsx`
- **Quyền**: Customer only

### 10. **My Custom Orders** (`/my-custom-orders`)
- **Mô tả**: Danh sách tất cả custom orders của khách hàng
- **File**: `src/pages/MyCustomOrders.jsx`
- **Quyền**: Customer only

### 11. **Custom Order Detail** (`/custom-orders/:id`)
- **Mô tả**: Chi tiết custom order cụ thể
- **File**: `src/pages/CustomOrderDetail.jsx`
- **Quyền**: Customer only

### 12. **3D Preview** (`/preview/:id`)
- **Mô tả**: Xem preview file 3D
- **File**: `src/pages/Preview3D.jsx`
- **Quyền**: Customer only (hoặc có thể mở rộng cho Staff)

### 13. **Feedback Form** (`/feedback/:orderId`)
- **Mô tả**: Form gửi phản hồi sau khi nhận đơn hàng
- **File**: `src/pages/FeedbackForm.jsx`
- **Quyền**: Customer only

---

## 👔 STAFF PAGES (Cần đăng nhập với role = 'employee')

Các trang này chỉ dành cho nhân viên đã đăng nhập:

### 1. **Staff Dashboard** (`/staff/dashboard`)
- **Mô tả**: Bảng điều khiển tổng quan cho nhân viên
- **File**: `src/pages/Staff/StaffDashboard.jsx`
- **Quyền**: Employee only

### 2. **Staff Custom Orders List** (`/staff/custom-orders`)
- **Mô tả**: Danh sách tất cả custom orders cần xử lý
- **File**: `src/pages/Staff/StaffCustomOrdersList.jsx`
- **Quyền**: Employee only

### 3. **Staff Custom Order Detail** (`/staff/custom-orders/:id`)
- **Mô tả**: Chi tiết custom order để nhân viên xử lý
- **File**: `src/pages/Staff/StaffCustomOrderDetail.jsx`
- **Quyền**: Employee only

### 4. **Design File Upload** (`/staff/upload-design/:orderId`)
- **Mô tả**: Upload file thiết kế 3D cho custom order
- **File**: `src/pages/Staff/DesignFileUpload.jsx`
- **Quyền**: Employee only

---

## 🔐 ADMIN PAGES (Cần đăng nhập với role = 'admin')

Các trang này chỉ dành cho quản trị viên đã đăng nhập:

### 1. **Admin Dashboard** (`/admin/dashboard`)
- **Mô tả**: Bảng điều khiển tổng quan cho admin
- **File**: `src/pages/Admin/AdminDashboard.jsx`
- **Quyền**: Admin only

### 2. **Manage Products** (`/admin/products`)
- **Mô tả**: Quản lý sản phẩm (thêm, sửa, xóa, vô hiệu hóa)
- **File**: `src/pages/Admin/ManageProducts.jsx`
- **Quyền**: Admin only

### 3. **Manage Materials** (`/admin/materials`)
- **Mô tả**: Quản lý vật liệu in 3D (thêm, sửa, xóa, giá, trạng thái)
- **File**: `src/pages/Admin/ManageMaterials.jsx`
- **Quyền**: Admin only

### 4. **Manage Staff Accounts** (`/admin/staff`)
- **Mô tả**: Quản lý tài khoản nhân viên (tạo, sửa, khóa/mở khóa)
- **File**: `src/pages/Admin/ManageStaffAccounts.jsx`
- **Quyền**: Admin only

### 5. **Manage Users** (`/admin/users`)
- **Mô tả**: Xem danh sách tất cả người dùng (Customer + Staff + Admin)
- **File**: `src/pages/Admin/ManageUsers.jsx`
- **Quyền**: Admin only

### 6. **Feedback List** (`/admin/feedback`)
- **Mô tả**: Xem và lọc tất cả phản hồi từ khách hàng
- **File**: `src/pages/Admin/FeedbackList.jsx`
- **Quyền**: Admin only

### 7. **System Settings** (`/admin/settings`)
- **Mô tả**: Cấu hình hệ thống (phương thức thanh toán, Zalo OA, thông báo)
- **File**: `src/pages/Admin/SystemSettings.jsx`
- **Quyền**: Admin only

---

## 📊 Tóm Tắt Theo Số Lượng

| Loại Trang | Số Lượng | Mô Tả |
|------------|----------|-------|
| **Public Pages** | 6 | Trang công khai, không cần đăng nhập |
| **Customer Pages** | 13 | Trang dành cho khách hàng |
| **Staff Pages** | 4 | Trang dành cho nhân viên |
| **Admin Pages** | 7 | Trang dành cho quản trị viên |
| **Tổng Cộng** | **30** | Tổng số trang trong ứng dụng |

---

## 🔒 Cơ Chế Bảo Vệ

Tất cả các trang được bảo vệ bằng component `ProtectedRoute` trong `src/components/ProtectedRoute.jsx`:

- **Không có quyền**: Tự động chuyển hướng về `/login`
- **Sai role**: Tự động chuyển hướng về `/` (trang chủ)
- **Đúng role**: Cho phép truy cập trang

### Ví dụ trong App.jsx:
```javascript
// Public route
<Route path="/products" element={<ProductCatalog />} />

// Protected route - any authenticated user
<Route
  path="/cart"
  element={
    <ProtectedRoute>
      <ShoppingCart />
    </ProtectedRoute>
  }
/>

// Protected route - employee only
<Route
  path="/staff/dashboard"
  element={
    <ProtectedRoute requiredRole="employee">
      <StaffDashboard />
    </ProtectedRoute>
  }
/>

// Protected route - admin only
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

---

## 📝 Ghi Chú

1. **Header Navigation**: Header tự động hiển thị menu phù hợp với role của người dùng
2. **Customer có thể xem**: Product Catalog và Product Detail nhưng cần đăng nhập để mua
3. **Staff có thể xem**: Tất cả trang của Customer + các trang Staff riêng
4. **Admin có thể xem**: Tất cả trang (Customer + Staff + Admin)

---

## 🧪 Test Accounts

Xem file `TEST_ACCOUNTS.md` để biết thông tin đăng nhập cho các role khác nhau.

