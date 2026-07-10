/** Chuẩn hóa SĐT VN: bỏ khoảng trắng, +84/84 → 0. */
export const normalizeVietnamesePhone = (phone) => {
  if (!phone) return '';
  let p = String(phone).trim().replace(/\s+/g, '');
  if (p.startsWith('+84')) p = `0${p.slice(3)}`;
  else if (p.startsWith('84') && p.length > 9) p = `0${p.slice(2)}`;
  return p.replace(/\D/g, '');
};

/** 10–11 chữ số, bắt đầu bằng 0 (giống UserProfilePage). */
export const isValidVietnamesePhone = (phone) =>
  /^0[0-9]{9,10}$/.test(normalizeVietnamesePhone(phone));

export const VIETNAMESE_PHONE_ERROR =
  'Số điện thoại không hợp lệ. Vui lòng nhập 10–11 chữ số, bắt đầu bằng 0.';
