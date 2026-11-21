import { api } from '../api.js';
import { element, showMessage } from '../public-data.js';

const list = document.getElementById('history-list');
const status = document.getElementById('history-status');
const searchInput = document.getElementById('history-search');
const trackSelect = document.getElementById('history-track');
const sortSelect = document.getElementById('history-sort');
const pageNav = document.getElementById('history-pagination');
const pageSize = 10;
let historyItems = [];
let currentPage = 1;
const trackNames = new Map();

function renderPage() {
  const search = searchInput.value.trim().toLocaleLowerCase('vi');
  const selectedTrack = trackSelect.value;
  const items = historyItems.filter((item) =>
    item.caseTitle.toLocaleLowerCase('vi').includes(search)
    && (!selectedTrack || item.trackName === trackNames.get(selectedTrack))
  );

  if (sortSelect.value === 'oldest') {
    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortSelect.value === 'highest') {
    items.sort((a, b) => Number(b.overallScore) - Number(a.overallScore));
  } else {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  list.replaceChildren();
  pageNav.replaceChildren();

  if (visibleItems.length === 0) {
    showMessage(status, items.length ? '' : 'Chưa có bài đánh giá phù hợp.');
    return;
  }

  showMessage(status, `Hiển thị ${visibleItems.length} trên ${items.length} bài đánh giá.`);
  for (const item of visibleItems) {
    const card = element('article', 'card history-item');
    const icon = element('div', 'history-icon bg-blue-light text-blue');
    icon.append(element('i', 'fa-solid fa-briefcase'));
    const info = element('div', 'history-info');
    const meta = element('div', 'history-meta text-muted text-sm mb-1');
    const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(item.createdAt));
    meta.append(
      element('span', '', ` ${date}`),
      element('span', 'mx-2', '•'),
      element('span', '', `Ngành: ${item.trackName}`)
    );
    info.append(meta, element('h2', 'history-title', item.caseTitle));

    const numericScore = Number(item.overallScore);
    const scoreClass = numericScore >= 7 ? 'badge-good' : numericScore >= 5 ? 'badge-average' : 'badge-poor';
    const score = element('div', `score-badge ${scoreClass}`, `${numericScore.toFixed(1)} / 10`);
    const scoreWrapper = element('div', 'history-score');
    scoreWrapper.append(score);

    const link = element('a', 'btn btn-outline btn-sm', 'Xem báo cáo');
    link.href = `result.html?id=${encodeURIComponent(item.id)}`;
    link.prepend(element('i', 'fa-solid fa-chart-simple ms-2'));
    const action = element('div', 'history-action');
    action.append(link);
    card.append(icon, info, scoreWrapper, action);
    list.append(card);
  }

  if (pageCount > 1) {
    const button = element('button', 'page-btn', '‹');
    button.type = 'button';
    button.disabled = currentPage === 1;
    button.setAttribute('aria-label', 'Trang trước');
    button.addEventListener('click', () => {
      currentPage -= 1;
      renderPage();
    });
    pageNav.append(button);
    for (let page = 1; page <= pageCount; page += 1) {
      const pageButton = element('button', `page-btn${page === currentPage ? ' active' : ''}`, String(page));
      pageButton.type = 'button';
      pageButton.setAttribute('aria-label', `Trang ${page}`);
      pageButton.addEventListener('click', () => {
        currentPage = page;
        renderPage();
      });
      pageNav.append(pageButton);
    }
    const next = element('button', 'page-btn', '›');
    next.type = 'button';
    next.disabled = currentPage === pageCount;
    next.setAttribute('aria-label', 'Trang sau');
    next.addEventListener('click', () => {
      currentPage += 1;
      renderPage();
    });
    pageNav.append(next);
  }
}

async function loadHistory() {
  try {
    const [history, tracks] = await Promise.all([
      api('/api/assessments/history', { auth: true }),
      api('/api/tracks')
    ]);
    historyItems = history.items;
    for (const track of tracks.items) {
      const option = element('option', '', track.name);
      option.value = track.id;
      trackSelect.append(option);
      trackNames.set(String(track.id), track.name);
    }
    renderPage();
  } catch (error) {
    showMessage(status, error.message || 'Không thể tải lịch sử đánh giá.', true);
  }
}

for (const filter of [searchInput, trackSelect, sortSelect]) {
  filter.addEventListener(filter === searchInput ? 'input' : 'change', () => {
    currentPage = 1;
    renderPage();
  });
}

loadHistory();
