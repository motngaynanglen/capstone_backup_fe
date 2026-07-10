function extractBodyMessage(body) {
  if (!body) return null;
  if (typeof body === 'string' && body.trim()) return body.trim();

  const direct =
    body.message ||
    body.Message ||
    body.detail ||
    body.Detail ||
    body.title ||
    body.Title;

  if (typeof direct === 'string' && direct.trim() && direct !== 'Unauthorized') {
    return direct.trim();
  }

  const errors =
    body.additionalData?.errors ||
    body.AdditionalData?.errors ||
    body.AdditionalData?.Errors;

  if (errors && typeof errors === 'object') {
    const msgs = Object.values(errors).flat().filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }

  return null;
}

function extractFieldErrors(body) {
  if (!body || typeof body !== 'object') return null;

  const errors =
    body.additionalData?.errors ||
    body.AdditionalData?.errors ||
    body.AdditionalData?.Errors;

  if (!errors || typeof errors !== 'object') return null;

  return errors;
}

export function parseApiFieldErrors(error, fieldMap = {}) {
  const body = error?.response?.data;
  const rawErrors = extractFieldErrors(body);
  if (!rawErrors) return {};

  const mapped = {};

  Object.entries(rawErrors).forEach(([apiField, messages]) => {
    const formField = fieldMap[apiField] || apiField.charAt(0).toLowerCase() + apiField.slice(1);
    const firstMessage = Array.isArray(messages) ? messages.find(Boolean) : messages;
    if (firstMessage) mapped[formField] = String(firstMessage);
  });

  return mapped;
}

export function getApiErrorMessage(error, fallbacks = {}) {
  const {
    default: defaultMsg = 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    network: networkMsg = 'Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau.',
    401: unauthorizedMsg,
    422: validationMsg,
    403: forbiddenMsg,
    500: serverErrorMsg,
    503: serviceUnavailableMsg,
  } = fallbacks;

  if (!error?.response) {
    return networkMsg;
  }

  const { status, data: body } = error.response;
  const fromBody = extractBodyMessage(body);
  if (fromBody) return fromBody;

  const statusFallbacks = {
    401: unauthorizedMsg,
    422: validationMsg,
    403: forbiddenMsg,
    500: serverErrorMsg,
    503: serviceUnavailableMsg ?? serverErrorMsg,
  };

  return statusFallbacks[status] || defaultMsg;
}
