import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { App } from 'antd';

const RegisterForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        contactPhone: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { message } = App.useApp();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            const result = await register({
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                email: formData.email,
                contactPhone: formData.contactPhone,
            });

            if (result.success) {
                message.success('Đăng ký thành công! Mời bạn đăng nhập.');
                // Gọi hàm onSuccess do component cha truyền vào
                if (onSuccess) onSuccess();
            } else {
                setError(result.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối server. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="block mb-1 text-sm font-medium">Họ & Tên</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>
            <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Số điện thoại</label>
                <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                    <label className="block mb-1 text-sm font-medium">Mật khẩu</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Xác nhận</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>

            {error && <div className="mb-4 text-red-500 text-sm font-medium bg-red-50 p-2 rounded border border-red-100">{error}</div>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
                {loading ? 'ĐANG TẠO...' : 'TẠO TÀI KHOẢN'}
            </button>
        </form>
    );
};

export default RegisterForm;