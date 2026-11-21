import { api } from '../api.js';

const form = document.getElementById('register-form');
const feedback = document.getElementById('register-feedback');
const submitButton = document.getElementById('register-submit');
const passwordInput = document.getElementById('password');

function validatePassword() {
  const password = passwordInput.value;
  const byteLength = new TextEncoder().encode(password).length;

  if (password.length < 8) {
    passwordInput.setCustomValidity('Mật khẩu cần có ít nhất 8 ký tự.');
  } else if (!/\p{L}/u.test(password)) {
    passwordInput.setCustomValidity('Mật khẩu cần có ít nhất một chữ cái.');
  } else if (!/[0-9]/.test(password)) {
    passwordInput.setCustomValidity('Mật khẩu cần có ít nhất một chữ số.');
  } else if (byteLength > 72) {
    passwordInput.setCustomValidity('Mật khẩu không được vượt quá 72 byte.');
  } else {
    passwordInput.setCustomValidity('');
  }
}

function showFeedback(message, success = false) {
  feedback.textContent = message;
  feedback.classList.remove('hidden', 'is-success');
  feedback.classList.toggle('is-success', success);
  feedback.setAttribute('role', success ? 'status' : 'alert');
}

function clearFeedback() {
  feedback.textContent = '';
  feedback.classList.add('hidden');
  feedback.classList.remove('is-success');
}

passwordInput.addEventListener('input', () => {
  validatePassword();
  clearFeedback();
});

form.addEventListener('input', clearFeedback);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  validatePassword();

  if (!form.reportValidity()) {
    return;
  }

  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Đang tạo tài khoản...';
  clearFeedback();

  try {
    const body = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: passwordInput.value
    };
    const result = await api('/api/auth/register', { method: 'POST', body });
    showFeedback(result.message || 'Đăng ký thành công. Bạn có thể đăng nhập ngay.', true);
    form.reset();
    passwordInput.setCustomValidity('');
  } catch (error) {
    showFeedback(error.message || 'Không thể đăng ký lúc này. Vui lòng thử lại.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});
