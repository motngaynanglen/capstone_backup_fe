import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getPostLoginPath } from "../../utils/authRedirect";
import { App } from "antd";

const LoginForm = ({ onSuccess }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { message } = App.useApp(); // Dùng chuẩn Antd v5

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await login(username, password);

            if (result.success) {
                message.success("Đăng nhập thành công!");

                // Nếu component cha (ví dụ Modal) có truyền hàm onSuccess vào, thì gọi nó (để đóng Modal)
                if (onSuccess) onSuccess();

                navigate(getPostLoginPath(result.user?.role));
            } else {
                setError(result.message || "Tên đăng nhập hoặc mật khẩu không đúng");
            }
        } catch (err) {
            setError("Lỗi kết nối server. Vui lòng kiểm tra lại đường truyền.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <label className="block mb-2 text-gray-700 font-semibold text-sm">
                    Tên đăng nhập / Email
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError("");
                    }}
                    required
                    placeholder="Nhập tài khoản của bạn"
                    className="w-full p-3 border border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            <div className="mb-6">
                <label className="block mb-2 text-gray-700 font-semibold text-sm">
                    Mật khẩu
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                    }}
                    required
                    placeholder="••••••••"
                    className="w-full p-3 border border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            <div className="flex justify-end items-center mb-6">
                <Link
                    to="/forgot-password"
                    className="text-indigo-600 no-underline text-xs font-bold hover:text-indigo-800 transition-colors"
                >
                    Quên mật khẩu?
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center text-sm font-medium border border-red-100 animate-pulse">
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full p-3 bg-gradient-to-r from-red-600 to-red-700 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
            >
                {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
            </button>
        </form>
    );
};

export default LoginForm;