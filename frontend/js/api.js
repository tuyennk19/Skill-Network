import { clearSession, getToken } from './auth.js';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  if (typeof path !== 'string' || !path.startsWith('/api/')) {
    throw new Error('Đường dẫn API không hợp lệ.');
  }

  const headers = { Accept: 'application/json' };
  const options = { method, headers };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new ApiError('Không thể kết nối tới máy chủ. Hãy kiểm tra server và thử lại.', 0, 'NETWORK_ERROR');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Máy chủ trả về phản hồi không hợp lệ.', response.status, 'INVALID_RESPONSE');
  }

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearSession();
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login.html?next=${encodeURIComponent(returnTo)}`);
    }

    throw new ApiError(
      typeof data.message === 'string' ? data.message : 'Yêu cầu không thành công.',
      response.status,
      typeof data.code === 'string' ? data.code : 'REQUEST_FAILED'
    );
  }

  return data;
}
