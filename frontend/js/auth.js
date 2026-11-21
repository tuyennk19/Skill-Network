const SESSION_KEY = 'skill_network_session';

export function saveSession(token, user) {
  if (typeof token !== 'string' || !token || !user || typeof user !== 'object') {
    throw new Error('Dữ liệu phiên đăng nhập không hợp lệ.');
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  } catch {
    throw new Error('Không thể lưu phiên đăng nhập trên trình duyệt này.');
  }
}

export function getSession() {
  let serializedSession;
  try {
    serializedSession = localStorage.getItem(SESSION_KEY);
  } catch {
    throw new Error('Không thể đọc phiên đăng nhập từ trình duyệt.');
  }

  if (!serializedSession) {
    return null;
  }

  try {
    const session = JSON.parse(serializedSession);
    if (typeof session.token !== 'string' || !session.token || !session.user) {
      throw new Error('Dữ liệu phiên đăng nhập không hợp lệ.');
    }
    return session;
  } catch {
    clearSession();
    throw new Error('Phiên đăng nhập được lưu không hợp lệ. Vui lòng đăng nhập lại.');
  }
}

export function getToken() {
  return getSession()?.token ?? null;
}

export function getUser() {
  return getSession()?.user ?? null;
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    throw new Error('Không thể xóa phiên đăng nhập khỏi trình duyệt.');
  }
}

export function requireLogin() {
  if (getToken()) {
    return true;
  }

  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/login.html?next=${encodeURIComponent(returnTo)}`);
  return false;
}

export function requireAdmin() {
  const user = getUser();
  if (user?.role === 'admin') {
    return true;
  }

  window.location.replace('/index.html');
  return false;
}

export function logout() {
  clearSession();
  window.location.replace('/login.html');
}
