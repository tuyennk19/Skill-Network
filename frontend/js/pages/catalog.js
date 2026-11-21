import { api, courseCard, element, showMessage } from '../public-data.js';

const searchInput = document.getElementById('course-search');
const trackSelect = document.getElementById('course-track');
const levelSelect = document.getElementById('course-level');
const list = document.getElementById('courses-list');
const status = document.getElementById('courses-status');
const pagination = document.getElementById('courses-pagination');
const pageSize = 12;
const requestedTrackId = new URLSearchParams(window.location.search).get('trackId');
let page = 1;
let requestVersion = 0;
let searchTimer;

async function loadTracks() {
  const { items } = await api('/api/tracks');
  for (const track of items) {
    const option = element('option', '', track.name);
    option.value = track.id;
    trackSelect.append(option);
  }
  if (requestedTrackId && items.some((track) => String(track.id) === requestedTrackId)) {
    trackSelect.value = requestedTrackId;
  }
}

function renderPagination(total) {
  pagination.replaceChildren();
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return;

  const addButton = (label, targetPage, disabled = false, active = false) => {
    const button = element('button', `page-btn${active ? ' active' : ''}`, label);
    button.type = 'button';
    button.disabled = disabled;
    button.setAttribute('aria-label', typeof label === 'string' ? label : 'Trang');
    button.addEventListener('click', () => {
      page = targetPage;
      loadCourses();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.append(button);
  };

  addButton('‹', page - 1, page === 1);
  const first = Math.max(1, Math.min(page - 2, pageCount - 4));
  const last = Math.min(pageCount, first + 4);
  for (let number = first; number <= last; number += 1) {
    addButton(String(number), number, false, number === page);
  }
  addButton('›', page + 1, page === pageCount);
}

async function loadCourses() {
  const version = ++requestVersion;
  const params = new URLSearchParams({
    search: searchInput.value.trim(),
    level: levelSelect.value,
    page: String(page),
    limit: String(pageSize)
  });
  if (trackSelect.value) params.set('trackId', trackSelect.value);

  showMessage(status, 'Đang tải danh sách khóa học...');
  list.replaceChildren();
  pagination.replaceChildren();
  try {
    const data = await api(`/api/courses?${params}`);
    if (version !== requestVersion) return;
    if (data.items.length === 0) {
      showMessage(status, 'Không tìm thấy khóa học phù hợp.');
      return;
    }

    showMessage(status, `Hiển thị ${data.items.length} trên ${data.total} khóa học.`);
    data.items.forEach((course) => list.append(courseCard(course)));
    renderPagination(data.total);
  } catch (error) {
    if (version === requestVersion) {
      showMessage(status, error.message || 'Không thể tải khóa học.', true);
    }
  }
}

searchInput.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    page = 1;
    loadCourses();
  }, 250);
});
trackSelect.addEventListener('change', () => {
  page = 1;
  loadCourses();
});
levelSelect.addEventListener('change', () => {
  page = 1;
  loadCourses();
});

loadTracks()
  .then(loadCourses)
  .catch((error) => showMessage(status, error.message || 'Không thể tải dữ liệu khóa học.', true));
