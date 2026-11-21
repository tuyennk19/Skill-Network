import {
  actionButton,
  closeModal,
  element,
  field,
  input,
  request,
  setNotice,
  statusLabel,
  bindLogout,
  guardAdminPage
} from './admin-common.js';

document.getElementById('track-list')?.replaceChildren();

if (guardAdminPage()) {
  bindLogout();
  const tracksBody = document.getElementById('track-list');
  const tracksSearch = document.getElementById('track-search');
  const criteriaContainer = document.querySelector('#criteria-modal .modal-body');
  const criteriaTitle = document.querySelector('#criteria-modal .modal-title');
  const trackModalTitle = document.querySelector('#track-modal .modal-title');
  const tracks = [];
  let editingTrackId = null;
  let selectedTrackId = null;
  let editingCriterionId = null;

  function renderTracks() {
    const filter = tracksSearch.value.trim().toLocaleLowerCase('vi');
    tracksBody.replaceChildren();
    const visibleTracks = tracks.filter((track) =>
      `${track.code} ${track.name}`.toLocaleLowerCase('vi').includes(filter)
    );

    for (const track of visibleTracks) {
      const row = element('tr');
      const values = [
        String(track.id),
        track.code,
        track.name,
        `${track.criteria.length} tiêu chí`
      ];
      for (const value of values) {
        const cell = element('td', '', value);
        row.append(cell);
      }
      const codeCell = row.children[1];
      codeCell.replaceChildren(element('span', 'badge-code', track.code));
      row.children[2].className = 'font-medium';
      const statusCell = element('td');
      statusCell.append(statusLabel(track.isActive));
      row.append(statusCell);
      const actions = element('div', 'action-btns');
      actions.append(
        actionButton('Quản lý tiêu chí', 'fa-solid fa-list-check', 'text-purple', () => openCriteria(track.id)),
        actionButton('Sửa thông tin', 'fa-regular fa-pen-to-square', 'text-blue', () => openTrackForm(track)),
        actionButton(track.isActive ? 'Tắt ngành' : 'Kích hoạt ngành', track.isActive ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye', track.isActive ? 'text-red' : 'text-green', () => toggleTrack(track)),
        actionButton('Xóa ngành', 'fa-regular fa-trash-can', 'text-red', () => deleteTrack(track))
      );
      const actionCell = element('td', 'text-right');
      actionCell.append(actions);
      row.append(actionCell);
      tracksBody.append(row);
    }

    if (visibleTracks.length === 0) {
      const row = element('tr');
      const cell = element('td', 'text-muted', 'Chưa có ngành nghề phù hợp.');
      cell.colSpan = 6;
      row.append(cell);
      tracksBody.append(row);
    }
    const count = document.querySelector('.table-footer .text-sm.text-muted');
    if (count) count.textContent = `Hiển thị ${visibleTracks.length} ngành nghề`;
  }

  async function loadTracks() {
    const data = await request('/api/admin/tracks');
    tracks.splice(0, tracks.length, ...data.items);
    renderTracks();
  }

  function openTrackForm(track = null) {
    editingTrackId = track?.id ?? null;
    trackModalTitle.textContent = track ? 'Sửa thông tin ngành nghề' : 'Thêm Ngành Nghề Mới';
    document.getElementById('track-code').value = track?.code ?? '';
    document.getElementById('track-name').value = track?.name ?? '';
    document.getElementById('track-description').value = track?.description ?? '';
    document.getElementById('track-modal').classList.add('show');
  }

  async function saveTrack() {
    const body = {
      code: document.getElementById('track-code').value.trim(),
      name: document.getElementById('track-name').value.trim(),
      description: document.getElementById('track-description').value.trim() || null,
      isActive: editingTrackId
        ? tracks.find((track) => track.id === editingTrackId).isActive
        : true
    };
    const path = editingTrackId ? `/api/admin/tracks/${editingTrackId}` : '/api/admin/tracks';
    await request(path, { method: editingTrackId ? 'PUT' : 'POST', body });
    closeModal('track-modal');
    setNotice(editingTrackId ? 'Đã cập nhật ngành nghề.' : 'Đã tạo ngành nghề.');
    await loadTracks();
  }

  async function toggleTrack(track) {
    await request(`/api/admin/tracks/${track.id}`, {
      method: 'PUT',
      body: { ...track, isActive: !track.isActive }
    });
    await loadTracks();
  }

  async function deleteTrack(track) {
    if (!window.confirm(`Xóa ngành "${track.name}"? Ngành đang được dùng sẽ không thể xóa.`)) return;
    await request(`/api/admin/tracks/${track.id}`, { method: 'DELETE' });
    setNotice('Đã xóa ngành nghề.');
    await loadTracks();
  }

  function criterionField(label, id, type = 'text') {
    const control = input(id, '', type);
    if (type === 'textarea') control.rows = 3;
    return field(label, control, 'form-group mb-0');
  }

  function renderCriterionForm(criterion = null) {
    editingCriterionId = criterion?.id ?? null;
    const card = element('div', 'card p-4');
    card.style.cssText = 'border:1px dashed var(--primary);background:transparent;';
    card.append(element('h4', 'font-medium mb-4', criterion ? 'Sửa tiêu chí' : 'Thêm tiêu chí mới'));
    const form = element('form', 'auth-form');
    form.style.maxWidth = '100%';
    const identity = element('div', 'admin-form-grid');
    identity.append(criterionField('Mã tiêu chí', 'criterion-code'), criterionField('Tên hiển thị', 'criterion-name'));
    const metadata = element('div', 'admin-form-grid mt-4');
    metadata.append(
      criterionField('Mô tả', 'criterion-description', 'textarea'),
      criterionField('Thứ tự hiển thị', 'criterion-sort-order', 'number')
    );
    const rubric = element('div', 'admin-rubric-grid mt-4');
    rubric.append(
      criterionField('Mô tả Yếu (0-4)', 'criterion-low', 'textarea'),
      criterionField('Mô tả Đạt (5-7)', 'criterion-mid', 'textarea'),
      criterionField('Mô tả Tốt (8-10)', 'criterion-high', 'textarea')
    );
    const save = element('button', 'btn btn-primary', criterion ? 'Cập nhật tiêu chí' : 'Lưu tiêu chí');
    save.type = 'submit';
    const saveRow = element('div', 'text-right mt-4');
    saveRow.append(save);
    form.append(identity, metadata, rubric, saveRow);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveCriterion().catch((error) => setNotice(error.message, true));
    });
    card.append(form);
    criteriaContainer.append(card);
    if (criterion) {
      document.getElementById('criterion-code').value = criterion.code;
      document.getElementById('criterion-name').value = criterion.name;
      document.getElementById('criterion-description').value = criterion.description ?? '';
      document.getElementById('criterion-sort-order').value = criterion.sortOrder;
      document.getElementById('criterion-low').value = criterion.rubricLow;
      document.getElementById('criterion-mid').value = criterion.rubricMid;
      document.getElementById('criterion-high').value = criterion.rubricHigh;
    }
  }

  function openCriteria(trackId) {
    selectedTrackId = trackId;
    const track = tracks.find((item) => item.id === trackId);
    criteriaTitle.textContent = `Quản lý Tiêu chí: ${track.name}`;
    criteriaContainer.replaceChildren();
    for (const criterion of track.criteria) {
      const card = element('div', 'card p-4 mb-4');
      const header = element('div', 'align-left-header');
      header.style.marginBottom = '16px';
      header.append(element('h4', 'font-medium', `${criterion.name} (${criterion.code})`));
      const actions = element('div', 'action-btns');
      actions.append(
        actionButton('Sửa', 'fa-regular fa-pen-to-square', 'text-blue', () => {
          criteriaContainer.replaceChildren();
          renderCriterionForm(criterion);
        }),
        actionButton('Xóa', 'fa-regular fa-trash-can', 'text-red', async () => {
          if (!window.confirm(`Xóa tiêu chí "${criterion.name}"? Các gán khóa học của tiêu chí này cũng sẽ bị xóa.`)) return;
          await request(`/api/admin/criteria/${criterion.id}`, { method: 'DELETE' });
          setNotice('Đã xóa tiêu chí.');
          await loadTracks();
          openCriteria(trackId);
        })
      );
      header.append(actions);
      const rubric = element('div', 'admin-rubric-grid');
      for (const [heading, text, color] of [
        ['Yếu (0 - 4)', criterion.rubricLow, 'bg-red-light'],
        ['Đạt (5 - 7)', criterion.rubricMid, 'bg-yellow-light'],
        ['Tốt (8 - 10)', criterion.rubricHigh, 'bg-green-light']
      ]) {
        const box = element('div', `rubric-box ${color}`);
        box.append(element('div', 'font-medium mb-1', heading), element('p', 'text-sm text-muted m-0', text));
        rubric.append(box);
      }
      card.append(header, rubric);
      criteriaContainer.append(card);
    }
    renderCriterionForm();
    document.getElementById('criteria-modal').classList.add('show');
  }

  async function saveCriterion() {
    const body = {
      code: document.getElementById('criterion-code').value.trim(),
      name: document.getElementById('criterion-name').value.trim(),
      description: document.getElementById('criterion-description').value.trim() || null,
      sortOrder: Number(document.getElementById('criterion-sort-order').value || 0),
      rubricLow: document.getElementById('criterion-low').value.trim(),
      rubricMid: document.getElementById('criterion-mid').value.trim(),
      rubricHigh: document.getElementById('criterion-high').value.trim()
    };
    const path = editingCriterionId
      ? `/api/admin/criteria/${editingCriterionId}`
      : `/api/admin/tracks/${selectedTrackId}/criteria`;
    await request(path, { method: editingCriterionId ? 'PUT' : 'POST', body });
    setNotice(editingCriterionId ? 'Đã cập nhật tiêu chí.' : 'Đã tạo tiêu chí.');
    await loadTracks();
    openCriteria(selectedTrackId);
  }

  document.getElementById('track-add').addEventListener('click', () => openTrackForm());
  document.getElementById('track-save').addEventListener('click', async (event) => {
    event.preventDefault();
    await saveTrack().catch((error) => setNotice(error.message, true));
  });
  tracksSearch.addEventListener('input', renderTracks);
  loadTracks().catch(() => {});
}
