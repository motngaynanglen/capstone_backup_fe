/**
 * Placeholder — bản clone cục bộ từng bị file 0-byte; không có tham chiếu trong src hiện tại.
 * Giữ export để tránh lỗi nếu sau này có import động.
 */
export function normalizeStaffTasks(tasks) {
  return Array.isArray(tasks) ? tasks : [];
}

export default { normalizeStaffTasks };
