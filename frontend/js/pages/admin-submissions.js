import {
  bindLogout,
  element,
  guardAdminPage,
  request
} from './admin-common.js';
import { getUser } from '../auth.js';

if (guardAdminPage()) {
  bindLogout();
  const greeting = document.querySelector('.admin-profile strong');
  const user = getUser();
  if (greeting && user?.fullName) greeting.textContent = user.fullName;

  const list = document.getElementById('submission-list');
  const trackFilter = document.getElementById('submission-track-filter');
  const pageLabel = document.getElementById('submission-page');
  const countLabel = document.getElementById('submission-count');
  let page = 1;
  let totalPages = 0;

  function formatDate(value) {
    return new Date(value).toLocaleString('vi-VN');
  }

  function renderTracks(items) {
    for (const track of items) {
      const option = element('option', '', track.name);
      option.value = track.id;
      trackFilter.append(option);
    }
  }

  function renderRows(items, pagination) {
    list.replaceChildren();
    if (items.length === 0) {
      const row = element('tr');
      const cell = element('td', 'text-muted', 'Không có bài nộp phù hợp.');
      cell.colSpan = 7;
      row.append(cell);
      list.append(row);
    }

    for (const item of items) {
      const row = element('tr');
      row.append(element('td', '', String(item.id)));
      const studentCell = element('td');
      studentCell.append(
        element('div', 'font-medium', item.fullName),
        element('div', 'text-xs text-muted', item.email)
      );
      row.append(studentCell);
      const caseCell = element('td');
      caseCell.append(
        element('span', 'text-sm line-clamp-1', item.caseTitle),
        element('div', 'text-xs text-muted', item.trackName)
      );
      row.append(caseCell);
      row.append(element('td', 'text-sm', formatDate(item.createdAt)));
      row.append(element('td', 'badge-code', item.overallScore.toFixed(1)));
      const status = element(
        'span',
        'badge badge-basic',
        item.isMock ? 'AI mẫu' : 'Đã chấm'
      );
      status.style.cssText = 'position:static;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
      const statusCell = element('td');
      statusCell.append(status);
      row.append(statusCell);

      const detailButton = element('button', 'action-btn text-purple');
      detailButton.type = 'button';
      detailButton.title = 'Xem kết quả';
      detailButton.setAttribute('aria-label', `Xem bài nộp #${item.id}`);
      detailButton.append(element('i', 'fa-solid fa-eye'));
      detailButton.addEventListener('click', () => loadDetails(item.id).catch(() => {}));
      const actionCell = element('td', 'text-right');
      actionCell.append(detailButton);
      row.append(actionCell);
      list.append(row);
    }

    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
    countLabel.textContent = `Hiển thị ${start} - ${end} trên ${pagination.total} bài nộp`;
    totalPages = pagination.totalPages;
    pageLabel.textContent = totalPages ? `Trang ${pagination.page}/${totalPages}` : 'Trang 0/0';
    document.getElementById('submission-previous').disabled = page <= 1;
    document.getElementById('submission-next').disabled = page >= totalPages;
  }

  async function loadSubmissions() {
    const params = new URLSearchParams();
    const filters = [
      ['trackId', trackFilter.value],
      ['minScore', document.getElementById('submission-min-score').value],
      ['maxScore', document.getElementById('submission-max-score').value],
      ['from', document.getElementById('submission-from').value],
      ['to', document.getElementById('submission-to').value]
    ];
    for (const [key, value] of filters) {
      if (value) params.set(key, value);
    }
    params.set('page', String(page));
    const data = await request(`/api/admin/assessments?${params}`);
    if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
      page = data.pagination.totalPages;
      return loadSubmissions();
    }
    renderRows(data.items, data.pagination);
  }

  function renderList(id, values) {
    const listNode = document.getElementById(id);
    listNode.replaceChildren();
    for (const value of values || []) {
      listNode.append(element('li', '', value));
    }
    if (!values?.length) {
      listNode.append(element('li', 'text-muted', 'Không có thông tin.'));
    }
  }

  async function loadDetails(id) {
    const detail = await request(`/api/admin/assessments/${id}`);
    document.querySelector('#submission-modal .modal-title').textContent =
      `Chi tiết bài nộp #${detail.id}`;
    document.getElementById('detail-student').textContent = detail.fullName;
    document.getElementById('detail-email').textContent = detail.email;
    document.getElementById('detail-meta').textContent =
      `${detail.trackName} · ${detail.caseTitle} · ${formatDate(detail.createdAt)}${detail.isMock ? ' · Kết quả AI mẫu' : ''}`;
    document.getElementById('detail-scenario').textContent = detail.scenario;
    document.getElementById('detail-answer').value = detail.answer;
    document.getElementById('detail-overall-score').textContent =
      `Điểm tổng: ${detail.overallScore.toFixed(1)}`;

    const criteria = document.getElementById('detail-criteria');
    criteria.replaceChildren();
    for (const criterion of detail.criteria) {
      const item = element('li');
      item.style.padding = '10px 16px';
      const nameAndComment = element('span');
      nameAndComment.append(
        element('strong', '', `${criterion.name}: ${criterion.score.toFixed(1)}`),
        element('div', 'text-xs text-muted mt-1', criterion.comment || 'Không có nhận xét.')
      );
      item.append(nameAndComment);
      criteria.append(item);
    }
    if (detail.criteria.length === 0) {
      const item = element('li', 'text-muted', 'Không có điểm tiêu chí.');
      item.style.padding = '10px 16px';
      criteria.append(item);
    }
    renderList('detail-strengths', detail.strengths);
    renderList('detail-weaknesses', detail.weaknesses);
    renderList('detail-advice', detail.advice);
    document.getElementById('detail-focus-topics').textContent =
      detail.focusTopics?.length ? detail.focusTopics.join(', ') : 'Không có.';
    document.getElementById('detail-result-json').textContent =
      JSON.stringify(detail.resultJson, null, 2);
    document.getElementById('submission-modal').classList.add('show');
  }

  document.getElementById('submission-filter-button').addEventListener('click', () => {
    page = 1;
    loadSubmissions().catch(() => {});
  });
  document.getElementById('submission-previous').addEventListener('click', () => {
    if (page > 1) {
      page -= 1;
      loadSubmissions().catch(() => {});
    }
  });
  document.getElementById('submission-next').addEventListener('click', () => {
    if (page < totalPages) {
      page += 1;
      loadSubmissions().catch(() => {});
    }
  });

  request('/api/admin/tracks')
    .then(({ items }) => {
      renderTracks(items);
      return loadSubmissions();
    })
    .catch(() => {});
}
