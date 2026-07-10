import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { App } from 'antd';
import {
    REGISTER_FIELD_KEYS,
    hasRegisterErrors,
    validateRegisterField,
    validateRegisterForm,
} from '../../utils/registerValidation';

const LIVE_VALIDATE_FIELDS = new Set(['email', 'contactPhone', 'password', 'confirmPassword']);

const FieldError = ({ message }) =>
    message ? <p className="mt-1 text-xs text-red-500 font-medium m-0">{message}</p> : null;

const inputClass = (hasError) =>
    `w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
        hasError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
    }`;

const RegisterForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        contactPhone: '',
        password: '',
        confirmPassword: '',
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { message } = App.useApp();

    const setFieldError = (field, errorMessage) => {
        setFieldErrors((prev) => ({ ...prev, [field]: errorMessage }));
    };

    const validateOneField = (field, nextFormData = formData) => {
        const errorMessage = validateRegisterField(field, nextFormData[field], nextFormData);
        setFieldError(field, errorMessage);
        return errorMessage;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextFormData = { ...formData, [name]: value };

        setFormData(nextFormData);
        setFormError('');

        if (LIVE_VALIDATE_FIELDS.has(name) || touched[name]) {
            validateOneField(name, nextFormData);
        }

        if (name === 'password' && (touched.confirmPassword || nextFormData.confirmPassword)) {
            validateOneField('confirmPassword', nextFormData);
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        validateOneField(name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const errors = validateRegisterForm(formData);
        setFieldErrors(errors);
        setTouched(
            REGISTER_FIELD_KEYS.reduce((acc, field) => {
                acc[field] = true;
                return acc;
            }, {})
        );

        if (hasRegisterErrors(errors)) {
            return;
        }

        setLoading(true);
        try {
            const result = await register({
                username: formData.username.trim(),
                password: formData.password,
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                contactPhone: formData.contactPhone.trim(),
            });

            if (result.success) {
                message.success('Đăng ký thành công! Mời bạn đăng nhập.');
                if (onSuccess) onSuccess();
                return;
            }

            if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
                setFieldErrors((prev) => ({ ...prev, ...result.fieldErrors }));
            } else {
                setFormError(result.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            setFormError(err?.message || 'Không thể đăng ký. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="email"
                    placeholder="tenban@gmail.com"
                    className={inputClass(fieldErrors.email)}
                />
                <FieldError message={fieldErrors.email} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="block mb-1 text-sm font-medium">Họ & Tên</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="name"
                        className={inputClass(fieldErrors.fullName)}
                    />
                    <FieldError message={fieldErrors.fullName} />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="username"
                        className={inputClass(fieldErrors.username)}
                    />
                    <FieldError message={fieldErrors.username} />
                </div>
            </div>

            <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Số điện thoại</label>
                <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="tel"
                    placeholder="0987654321"
                    className={inputClass(fieldErrors.contactPhone)}
                />
                <FieldError message={fieldErrors.contactPhone} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                    <label className="block mb-1 text-sm font-medium">Mật khẩu</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="new-password"
                        placeholder="6–20 ký tự"
                        className={inputClass(fieldErrors.password)}
                    />
                    <FieldError message={fieldErrors.password} />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Nhập lại mật khẩu</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                        className={inputClass(fieldErrors.confirmPassword)}
                    />
                    <FieldError message={fieldErrors.confirmPassword} />
                </div>
            </div>

            {formError && (
                <div className="mb-4 text-red-500 text-sm font-medium bg-red-50 p-2 rounded border border-red-100">
                    {formError}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all disabled:opacity-50 mt-4"
            >
                {loading ? 'ĐANG TẠO...' : 'TẠO TÀI KHOẢN'}
            </button>
        </form>
    );
};

export default RegisterForm;
