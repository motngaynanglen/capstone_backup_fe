import axiosInstance from './axiosInstance'; // Đảm bảo đường dẫn này trỏ đúng file cấu hình axios của bạn

// 1. Lấy thông tin cá nhân
export const getMyProfileApi = async () => {
    const response = await axiosInstance.get('/api/account/me');
    return response.data;
};

// 2. Cập nhật thông tin cá nhân
export const updateMyProfileApi = async ({ fullname, contactPhone }) => {
    const payload = { fullname, contactPhone };
    const response = await axiosInstance.patch('/api/account/me/update', payload);
    return response.data;
};

// 3. Đổi mật khẩu
export const changePasswordApi = async ({ oldPassword, newPassword, confirmNewPassword }) => {
    const payload = { oldPassword, newPassword, confirmNewPassword };
    const response = await axiosInstance.patch('/api/account/change-password', payload);
    return response.data;
};
// 4. Truy vấn danh sách tài khoản (Có phân trang, tìm kiếm)
export const queryAccountsApi = async ({
    role, search, sortBy, sortDescending, includeDeleted, paging
}) => {
    const payload = {
        role,
        search,
        sortBy,
        sortDescending,
        includeDeleted,
        paging
    };
    const response = await axiosInstance.post('/api/account/query', payload);
    return response.data;
};

// 5. Thêm tài khoản mới
export const createAccountApi = async ({
    username, password, fullname, email, contactPhone, role
}) => {
    const payload = {
        username,
        password,
        fullname,
        email,
        contactPhone,
        role
    };
    const response = await axiosInstance.post('/api/account/add', payload);
    return response.data;
};

// 6. Lấy chi tiết 1 tài khoản (ID truyền thẳng vào URL)
export const getAccountDetailApi = async (id) => {
    const response = await axiosInstance.get(`/api/account/${id}/detail`);
    return response.data;
};

// 7. Cập nhật thông tin tài khoản (Chặn rác dữ liệu ở đây)
export const updateAccountApi = async (id, { fullname, email, password, contactPhone, isActive }) => {
    const payload = {
        fullname,
        email,
        contactPhone,
        isActive
    };
    // Chỉ đính kèm password vào payload nếu thực sự có truyền mật khẩu mới
    if (password) {
        payload.password = password;
    }

    const response = await axiosInstance.patch(`/api/account/${id}/update`, payload);
    return response.data;
};

// 8. Kích hoạt tài khoản
export const activateAccountApi = async (id) => {
    const response = await axiosInstance.patch(`/api/account/${id}/active`, {});
    return response.data;
};

// 9. Vô hiệu hóa (Tạm ngưng) tài khoản
export const deactivateAccountApi = async (id) => {
    const response = await axiosInstance.patch(`/api/account/${id}/deactive`, {});
    return response.data;
};

// 10. Xóa mềm tài khoản
export const deleteAccountApi = async (id) => {
    const response = await axiosInstance.delete(`/api/account/${id}/delete`, { data: {} });
    return response.data;
};