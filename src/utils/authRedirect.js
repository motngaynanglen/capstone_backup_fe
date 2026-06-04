/** Đường dẫn mặc định sau đăng nhập theo role (STAFF, MANAGER, …). */
export function getPostLoginPath(role) {
  const r = role?.toLowerCase() || '';
  if (r === 'manager') return '/manager/dashboard';
  if (r === 'admin') return '/admin';
  if (['employee', 'staff'].includes(r)) return '/staff/dashboard';
  return '/';
}
