import { api } from '../api.js';
import { saveSession } from '../auth.js';

const form = document.getElementById('login-form');
const feedback = document.getElementById('login-feedback');
const submitButton = document.getElementById('login-submit');

function showFeedback(message) {
  feedback.textContent = message;
  feedback.classList.remove('hidden');
}

function getPostLoginPath(role) {
  const requestedPath = new URLSearchParams(window.location.search).get('next');
  if (requestedPath) {
    try {
      const target = new URL(requestedPath, window.location.origin);
      if (
        target.origin === window.location.origin
        && target.pathname !== '/login.html'
        && target.pathname !== '/register.html'
      ) {
        return `${target.pathname}${target.search}${target.hash}`;
      }
    } catch {
      return role === 'admin' ? '/admin/index.html' : '/index.html';
    }
  }

  return role === 'admin' ? '/admin/index.html' : '/index.html';
}

const registeredNotice = document.getElementById('register-success');
if (new URLSearchParams(window.location.search).get('registered') === '1') {
  registeredNotice.classList.remove('hidden');
}

form.addEventListener('input', () => {
  feedback.textContent = '';
  feedback.classList.add('hidden');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Đang đăng nhập...';
  feedback.textContent = '';
  feedback.classList.add('hidden');

  try {
    const body = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    };
    const result = await api('/api/auth/login', { method: 'POST', body });
    saveSession(result.token, result.user);
    window.location.assign(getPostLoginPath(result.user.role));
  } catch (error) {
    showFeedback(error.message || 'Không thể đăng nhập lúc này. Vui lòng thử lại.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});
