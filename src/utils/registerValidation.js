import { normalizeVietnamesePhone } from './phoneValidation';

const USERNAME_PATTERN = /^[a-zA-Z0-9@._-]+$/;
const GMAIL_PATTERN = /^[a-zA-Z0-9._-]+@gmail\.com$/i;
const REGISTER_PHONE_PATTERN = /^0[0-9]{9}$/;

export const REGISTER_FIELD_KEYS = [
  'email',
  'fullName',
  'username',
  'contactPhone',
  'password',
  'confirmPassword',
];

export const REGISTER_API_FIELD_MAP = {
  Username: 'username',
  Email: 'email',
  ContactPhone: 'contactPhone',
  Password: 'password',
  Fullname: 'fullName',
};

const EMPTY_FIELD_MESSAGES = {
  email: 'Vui lòng nhập email',
  fullName: 'Vui lòng nhập họ và tên',
  username: 'Vui lòng nhập tên đăng nhập',
  contactPhone: 'Vui lòng nhập số điện thoại',
  password: 'Vui lòng nhập mật khẩu',
  confirmPassword: 'Vui lòng nhập lại mật khẩu',
};

export function validateRegisterField(field, value, formData = {}) {
  const trimmed = typeof value === 'string' ? value.trim() : value;

  switch (field) {
    case 'email':
      if (!trimmed) return EMPTY_FIELD_MESSAGES.email;
      if (!GMAIL_PATTERN.test(trimmed)) {
        return 'Email phải đúng định dạng [tên]@gmail.com';
      }
      return '';

    case 'fullName':
      if (!trimmed) return EMPTY_FIELD_MESSAGES.fullName;
      if (trimmed.length > 100) return 'Họ và tên tối đa 100 ký tự';
      return '';

    case 'username':
      if (!trimmed) return EMPTY_FIELD_MESSAGES.username;
      if (trimmed.length < 3) return 'Tên đăng nhập tối thiểu 3 ký tự';
      if (!USERNAME_PATTERN.test(trimmed)) {
        return 'Tên đăng nhập không được chứa dấu và khoảng trắng';
      }
      return '';

    case 'contactPhone': {
      if (!trimmed) return EMPTY_FIELD_MESSAGES.contactPhone;
      const normalized = normalizeVietnamesePhone(trimmed);
      if (!REGISTER_PHONE_PATTERN.test(normalized)) {
        return 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0';
      }
      return '';
    }

    case 'password':
      if (!value) return EMPTY_FIELD_MESSAGES.password;
      if (value.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
      if (value.length > 20) return 'Mật khẩu tối đa 20 ký tự';
      return '';

    case 'confirmPassword':
      if (!value) return EMPTY_FIELD_MESSAGES.confirmPassword;
      if (formData.password && value !== formData.password) {
        return 'Mật khẩu xác nhận không khớp';
      }
      return '';

    default:
      return '';
  }
}

export function validateRegisterForm(formData) {
  const errors = {};

  REGISTER_FIELD_KEYS.forEach((field) => {
    const message = validateRegisterField(field, formData[field], formData);
    if (message) errors[field] = message;
  });

  return errors;
}

export function hasRegisterErrors(errors) {
  return Object.values(errors).some(Boolean);
}
