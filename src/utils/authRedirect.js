export function isPathAllowedForRole(role, path) {
  if (!path || path === '/login' || path === '/register' || path === '/admin/login') return false;

  const r = role?.toLowerCase() || '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedPath.startsWith('/admin')) return r === 'admin';
  if (normalizedPath.startsWith('/manager')) return r === 'manager' || r === 'admin';
  if (normalizedPath.startsWith('/staff')) return ['employee', 'staff'].includes(r);

  return !['admin', 'manager', 'employee', 'staff'].includes(r);
}

export function getLocationPath(location) {
  if (!location?.pathname) return '';
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
}

/** Đường dẫn mặc định sau đăng nhập theo role (STAFF, MANAGER, ...). */
export function getPostLoginPath(role, preferredPath = '') {
  if (isPathAllowedForRole(role, preferredPath)) return preferredPath;

  const r = role?.toLowerCase() || '';
  if (r === 'manager') return '/manager/dashboard';
  if (r === 'admin') return '/admin';
  if (['employee', 'staff'].includes(r)) return '/staff/dashboard';
  return '/';
}
