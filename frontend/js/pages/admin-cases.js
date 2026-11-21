import {
  actionButton,
  bindLogout,
  closeModal,
  element,
  field,
  input,
  request,
  select,
  setNotice,
  statusLabel,
  guardAdminPage
} from './admin-common.js';

document.getElementById('case-list')?.replaceChildren();

if (guardAdminPage()) {
  bindLogout();
  const rows = document.getElementById('case-list');
  const filter = document.getElementById('case-track-filter');
  const search = document.getElementById('case-search');
  const modalBody = document.getElementById('case-form-container');
  const modalTitle = document.querySelector('#case-modal .modal-title');
  const cases = [];
  let tracks = [];
  let editingCaseId = null;

  function renderTrackOptions() {
    const selected = filter.value;
    filter.replaceChildren();
    const allOption = element('option', '', 'Lọc theo Ngành');
    allOption.value = '';
    filter.append(allOption);
    for (const track of tracks) {
      const option = element('option', '', track.name);
      option.value = track.id;
      filter.append(option);
    }
    filter.value = selected;
  }

  function renderCases() {
    const query = search.value.trim().toLocaleLowerCase('vi');
    const trackId = filter.value;
    const visible = cases.filter((item) =>
      (!trackId || String(item.trackId) === trackId)
      && `${item.title} ${item.trackName}`.toLocaleLowerCase('vi').includes(query)
    );
    rows.replaceChildren();
    for (const item of visible) {
      const row = element('tr');
      row.append(element('td', '', String(item.id)));
      const title = element('td');
      title.append(element('div', 'font-medium line-clamp-1', item.title));
      row.append(title);
      const trackCell = element('td');
      trackCell.append(element('span', 'badge-code', item.trackName));
      row.append(trackCell);
      row.append(element('td', '', item.difficulty));
      const status = element('td');
      status.append(statusLabel(item.isActive, 'Đang mở'));
      row.append(status);
      const actions = element('div', 'action-btns');
      actions.append(
        actionButton('Sửa', 'fa-regular fa-pen-to-square', 'text-blue', () => openCaseForm(item)),
        actionButton(item.isActive ? 'Tắt tình huống' : 'Mở tình huống', item.isActive ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye', item.isActive ? 'text-red' : 'text-green', () => toggleCase(item)),
        actionButton('Xóa', 'fa-regular fa-trash-can', 'text-red', () => deleteCase(item))
      );
      const actionCell = element('td', 'text-right');
      actionCell.append(actions);
      row.append(actionCell);
      rows.append(row);
    }
    if (visible.length === 0) {
      const row = element('tr');
      const cell = element('td', 'text-muted', 'Chưa có tình huống phù hợp.');
      cell.colSpan = 6;
      row.append(cell);
      rows.append(row);
    }
    const count = document.querySelector('.table-footer .text-sm.text-muted');
    if (count) count.textContent = `Hiển thị ${visible.length} tình huống`;
  }

  async function loadCases() {
    const query = filter.value ? `?trackId=${encodeURIComponent(filter.value)}` : '';
    const data = await request(`/api/admin/cases${query}`);
    cases.splice(0, cases.length, ...data.items);
    renderCases();
  }

  async function loadTracks() {
    const data = await request('/api/admin/tracks');
    tracks = data.items;
    renderTrackOptions();
  }

  function buildCaseForm(item = null) {
    editingCaseId = item?.id ?? null;
    modalTitle.textContent = item ? 'Cập nhật tình huống' : 'Thêm tình huống mới';
    const form = element('form', 'auth-form');
    form.style.maxWidth = '100%';
    const card = element('div', 'card p-4');
    const title = input('case-title', 'Ví dụ: Khách hàng cần thêm căn cứ về hiệu quả đầu tư');
    title.required = true;
    const track = select('case-track', tracks.map((entry) => [String(entry.id), entry.name]));
    track.required = true;
    const top = element('div', 'admin-form-grid');
    top.append(field('Tiêu đề tình huống', title, 'form-group mb-0'), field('Ngành nghề', track, 'form-group mb-0'));
    const difficulty = select('case-difficulty', [['Dễ', 'Dễ'], ['Trung bình', 'Trung bình'], ['Khó', 'Khó']]);
    const active = select('case-active', [['1', 'Mở cho học viên'], ['0', 'Tạm ẩn']]);
    const options = element('div', 'admin-form-grid mt-4');
    options.append(field('Độ khó', difficulty, 'form-group mb-0'), field('Trạng thái', active, 'form-group mb-0'));
    const scenario = input('case-scenario', 'Mô tả bối cảnh chi tiết để học viên giải quyết...', 'textarea');
    scenario.rows = 7;
    scenario.required = true;
    scenario.minLength = 20;
    scenario.style.resize = 'vertical';
    const content = field('Nội dung bối cảnh', scenario, 'form-group mt-4 mb-0');
    content.append(element('p', 'text-xs text-muted mt-2', 'AI sẽ dùng nội dung này làm bối cảnh để đánh giá câu trả lời.'));
    card.append(top, options, content);
    const error = element('p', 'text-sm text-red mt-3');
    error.id = 'case-form-error';
    error.setAttribute('role', 'alert');
    form.append(card, error);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveCase().catch((error) => setNotice(error.message, true));
    });
    modalBody.replaceChildren(form);
    if (item) {
      document.getElementById('case-title').value = item.title;
      document.getElementById('case-track').value = item.trackId;
      document.getElementById('case-difficulty').value = item.difficulty;
      document.getElementById('case-active').value = item.isActive ? '1' : '0';
      document.getElementById('case-scenario').value = item.scenario;
    }
    document.getElementById('case-modal').classList.add('show');
  }

  async function saveCase() {
    const body = {
      trackId: Number(document.getElementById('case-track').value),
      title: document.getElementById('case-title').value.trim(),
      scenario: document.getElementById('case-scenario').value.trim(),
      difficulty: document.getElementById('case-difficulty').value,
      isActive: document.getElementById('case-active').value === '1'
    };
    const path = editingCaseId ? `/api/admin/cases/${editingCaseId}` : '/api/admin/cases';
    await request(path, { method: editingCaseId ? 'PUT' : 'POST', body });
    closeModal('case-modal');
    setNotice(editingCaseId ? 'Đã cập nhật tình huống.' : 'Đã tạo tình huống.');
    await loadCases();
  }

  async function toggleCase(item) {
    await request(`/api/admin/cases/${item.id}`, {
      method: 'PUT',
      body: { ...item, isActive: !item.isActive }
    });
    await loadCases();
  }

  async function deleteCase(item) {
    if (!window.confirm(`Xóa tình huống "${item.title}"? Tình huống đã có bài nộp sẽ không thể xóa.`)) return;
    await request(`/api/admin/cases/${item.id}`, { method: 'DELETE' });
    setNotice('Đã xóa tình huống.');
    await loadCases();
  }

  document.getElementById('case-add').addEventListener('click', () => buildCaseForm());
  document.getElementById('case-save').addEventListener('click', async () => {
    modalBody.querySelector('form')?.requestSubmit();
  });
  search.addEventListener('input', renderCases);
  filter.addEventListener('change', () => loadCases().catch(() => {}));

  loadTracks()
    .then(loadCases)
    .catch(() => {});
}
