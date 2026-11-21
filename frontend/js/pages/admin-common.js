import { api } from '../api.js';
import { logout, requireAdmin, requireLogin } from '../auth.js';

export function guardAdminPage() {
  return requireLogin() && requireAdmin();
}

export function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function field(labelText, control, className = 'form-group') {
  const wrapper = element('div', className);
  const label = element('label', 'form-label', labelText);
  label.htmlFor = control.id;
  wrapper.append(label, control);
  return wrapper;
}

export function input(id, placeholder = '', type = 'text') {
  const control = element(type === 'textarea' ? 'textarea' : 'input', 'form-input');
  control.id = id;
  control.placeholder = placeholder;
  control.style.paddingLeft = '14px';
  if (type !== 'textarea') control.type = type;
  return control;
}

export function select(id, entries) {
  const control = element('select', 'form-input');
  control.id = id;
  control.style.paddingLeft = '14px';
  for (const [value, label] of entries) {
    const option = element('option', '', label);
    option.value = value;
    control.append(option);
  }
  return control;
}

export function setNotice(message, isError = false) {
  let notice = document.getElementById('admin-notice');
  if (!notice) {
    notice = element('div');
    notice.id = 'admin-notice';
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'margin-bottom:16px;padding:12px 16px;border-radius:8px;';
    document.querySelector('.admin-content-inner')?.prepend(notice);
  }
  notice.textContent = message;
  notice.style.backgroundColor = isError ? '#fef2f2' : '#ecfdf5';
  notice.style.color = isError ? '#b91c1c' : '#047857';
}

export async function request(path, options) {
  try {
    return await api(path, { ...options, auth: true });
  } catch (error) {
    setNotice(error.message || 'Yêu cầu không thành công.', true);
    throw error;
  }
}

export function bindLogout() {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', logout);
  });
  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.dataset.modalClose));
  });
}

export function actionButton(label, icon, color, onClick) {
  const button = element('button', `action-btn ${color}`);
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  const symbol = element('i', icon);
  button.append(symbol);
  button.addEventListener('click', () => {
    Promise.resolve()
      .then(onClick)
      .catch((error) => setNotice(error.message || 'Thao tác không thành công.', true));
  });
  return button;
}

export function statusLabel(isActive, activeText = 'Hoạt động') {
  return element(
    'span',
    `status-dot ${isActive ? 'status-active' : 'status-inactive'}`,
    isActive ? activeText : 'Đã tắt'
  );
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('show');
}

export { api };
