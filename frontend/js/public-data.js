import { api } from './api.js';

export function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function showMessage(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle('text-red', isError);
  target.setAttribute('role', isError ? 'alert' : 'status');
  target.hidden = !message;
}

export function courseCard(course) {
  const card = element('article', 'card course-card');
  const thumb = element('div', 'course-thumb dynamic-course-thumb');
  if (course.thumbnailUrl) {
    const image = element('img', 'dynamic-course-image');
    image.src = course.thumbnailUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove());
    thumb.append(image);
  } else {
    thumb.append(element('i', 'fa-solid fa-book-open dynamic-course-placeholder'));
  }

  const levelClass = course.level === 'Cơ bản'
    ? 'badge-basic'
    : course.level === 'Nâng cao' ? 'badge-advanced' : 'badge-medium';
  thumb.append(element('span', `badge ${levelClass}`, course.level));
  if (course.isDemo) thumb.append(element('span', 'demo-badge', 'Dữ liệu mẫu'));

  const body = element('div', 'course-body');
  const title = element('a', 'card-title course-card-link', course.title);
  title.href = `course-detail.html?id=${encodeURIComponent(course.id)}`;
  const descriptionText = course.description && !/^dữ liệu demo$/i.test(course.description.trim())
    ? course.description
    : 'Mô tả đang được cập nhật.';
  const description = element(
    'p',
    'card-desc',
    descriptionText
  );
  const meta = element('div', 'course-meta');
  const duration = element('span', '', course.durationHours ? `${course.durationHours} giờ` : 'Chưa cập nhật thời lượng');
  duration.prepend(element('i', 'fa-regular fa-clock'));
  meta.append(duration);
  body.append(title, description, meta);
  card.append(thumb, body);
  return card;
}

export function difficultyBadge(difficulty) {
  const badgeClass = difficulty === 'Dễ'
    ? 'badge-basic'
    : difficulty === 'Khó' ? 'badge-advanced' : 'badge-medium';
  const badge = element('span', `badge ${badgeClass}`, difficulty);
  badge.style.position = 'static';
  return badge;
}

export { api };
