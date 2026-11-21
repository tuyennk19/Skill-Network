import { api } from '../api.js';
import { clearSession, getToken, saveSession } from '../auth.js';

const loadStatus = document.getElementById('profile-load-status');
const infoForm = document.getElementById('profile-info-form');
const passwordForm = document.getElementById('profile-password-form');
const fullNameInput = document.getElementById('profile-full-name');
const emailInput = document.getElementById('profile-email-input');
const infoFeedback = document.getElementById('profile-info-feedback');
const passwordFeedback = document.getElementById('profile-password-feedback');
const infoSubmit = document.getElementById('profile-info-submit');
const passwordSubmit = document.getElementById('profile-password-submit');
const roleNames = { student: 'Học viên', admin: 'Quản trị viên' };

function showFeedback(target, message, isError = false) {
  target.textContent = message;
  target.hidden = !message;
  target.classList.toggle('is-error', isError);
  target.classList.toggle('is-success', Boolean(message) && !isError);
  target.setAttribute('role', isError ? 'alert' : 'status');
}

function renderUser(user) {
  fullNameInput.value = user.fullName;
  emailInput.value = user.email;
  document.getElementById('profile-name').textContent = user.fullName;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-role').textContent = roleNames[user.role] || 'Tài khoản';
  document.getElementById('profile-avatar').textContent = user.fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('vi');
  document.title = `Hồ sơ: ${user.fullName} - Skill_Network`;
}

async function loadProfile() {
  if (!getToken()) {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login.html?next=${encodeURIComponent(returnTo)}`);
    return;
  }

  try {
    const { user } = await api('/api/auth/me', { auth: true });
    const token = getToken();
    if (!token) return;
    saveSession(token, user);
    renderUser(user);
    loadStatus.hidden = true;
    infoForm.hidden = false;
    passwordForm.hidden = false;
  } catch (error) {
    loadStatus.textContent = error.message || 'Không thể tải thông tin tài khoản.';
    loadStatus.classList.add('is-error');
    loadStatus.setAttribute('role', 'alert');
  }
}

infoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!infoForm.reportValidity()) return;

  const originalLabel = infoSubmit.textContent;
  infoSubmit.disabled = true;
  infoSubmit.textContent = 'Đang cập nhật...';
  showFeedback(infoFeedback, '');

  try {
    const { user } = await api('/api/auth/me', {
      method: 'PATCH',
      auth: true,
      body: { fullName: fullNameInput.value.trim() }
    });
    const token = getToken();
    if (token) saveSession(token, user);
    renderUser(user);
    showFeedback(infoFeedback, 'Thông tin cá nhân đã được cập nhật.');
  } catch (error) {
    showFeedback(infoFeedback, error.message || 'Không thể cập nhật thông tin.', true);
  } finally {
    infoSubmit.disabled = false;
    infoSubmit.textContent = originalLabel;
  }
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!passwordForm.reportValidity()) return;

  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const password = newPassword.value;
  const byteLength = new TextEncoder().encode(password).length;
  if (!/\p{L}/u.test(password) || !/[0-9]/.test(password) || byteLength > 72) {
    showFeedback(
      passwordFeedback,
      'Mật khẩu mới cần có ít nhất 8 ký tự, gồm chữ cái và chữ số, tối đa 72 byte.',
      true
    );
    return;
  }

  const originalContent = [...passwordSubmit.childNodes].map((node) => node.cloneNode(true));
  passwordSubmit.disabled = true;
  passwordSubmit.textContent = 'Đang cập nhật...';
  showFeedback(passwordFeedback, '');

  try {
    const { user } = await api('/api/auth/me', {
      method: 'PATCH',
      auth: true,
      body: {
        currentPassword: currentPassword.value,
        newPassword: password
      }
    });
    const token = getToken();
    if (token) saveSession(token, user);
    passwordForm.reset();
    showFeedback(passwordFeedback, 'Mật khẩu đã được cập nhật thành công.');
  } catch (error) {
    showFeedback(passwordFeedback, error.message || 'Không thể cập nhật mật khẩu.', true);
  } finally {
    passwordSubmit.disabled = false;
    passwordSubmit.replaceChildren(...originalContent);
  }
});

document.getElementById('profile-logout').addEventListener('click', () => {
  clearSession();
  window.location.assign('/login.html');
});

loadProfile();
