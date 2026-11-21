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

document.getElementById('course-list')?.replaceChildren();

if (guardAdminPage()) {
  bindLogout();
  const rows = document.getElementById('course-list');
  const search = document.getElementById('course-search');
  const levelFilter = document.getElementById('course-level-filter');
  const modalBody = document.getElementById('course-form-container');
  const courses = [];
  let tracks = [];
  let editingCourse = null;

  function renderCourses() {
    const query = search.value.trim().toLocaleLowerCase('vi');
    const level = levelFilter.value;
    const visible = courses.filter((course) =>
      (!level || course.level === level)
      && course.title.toLocaleLowerCase('vi').includes(query)
    );
    rows.replaceChildren();

    for (const course of visible) {
      const row = element('tr');
      row.append(element('td', '', String(course.id)));
      const info = element('td');
      const layout = element('div');
      layout.style.cssText = 'display:flex;align-items:center;gap:12px;';
      const thumbnail = element('div');
      thumbnail.style.cssText = 'width:40px;height:40px;flex:none;border-radius:6px;background:linear-gradient(135deg,#dbeafe,#ede9fe);display:grid;place-items:center;color:#4f46e5;';
      if (course.thumbnailUrl && /^https?:\/\//i.test(course.thumbnailUrl)) {
        const image = element('img');
        image.src = course.thumbnailUrl;
        image.alt = '';
        image.loading = 'lazy';
        image.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:6px;';
        image.addEventListener('error', () => image.remove());
        thumbnail.append(image);
      } else {
        thumbnail.append(element('i', 'fa-solid fa-book-open'));
      }
      const details = element('div');
      details.append(element('div', 'font-medium', course.title));
      const criterionNames = course.criteria.map((criterion) => criterion.name).join(', ');
      details.append(element('div', 'text-xs text-muted mt-1', criterionNames ? `Tiêu chí: ${criterionNames}` : 'Chưa gán tiêu chí'));
      if (course.isDemo) details.append(element('span', 'badge-code mt-1', 'Dữ liệu mẫu'));
      layout.append(thumbnail, details);
      info.append(layout);
      row.append(info);
      row.append(element('td', '', course.level));
      row.append(element('td', '', course.durationHours ? `${course.durationHours} giờ` : '—'));
      const status = element('td');
      status.append(statusLabel(course.isActive));
      row.append(status);
      const actions = element('div', 'action-btns');
      actions.append(
        actionButton('Sửa thông tin', 'fa-regular fa-pen-to-square', 'text-blue', () => openCourseForm(course)),
        actionButton(course.isActive ? 'Ẩn khóa học' : 'Kích hoạt khóa học', course.isActive ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye', course.isActive ? 'text-red' : 'text-green', () => toggleCourse(course))
      );
      if (!course.isDemo) {
        actions.append(actionButton('Xóa khóa học', 'fa-regular fa-trash-can', 'text-red', () => deleteCourse(course)));
      }
      const actionCell = element('td', 'text-right');
      actionCell.append(actions);
      row.append(actionCell);
      rows.append(row);
    }

    if (visible.length === 0) {
      const row = element('tr');
      const cell = element('td', 'text-muted', 'Chưa có khóa học phù hợp.');
      cell.colSpan = 6;
      row.append(cell);
      rows.append(row);
    }
    const count = document.querySelector('.table-footer .text-sm.text-muted');
    if (count) count.textContent = `Hiển thị ${visible.length} khóa học`;
  }

  async function loadCourses() {
    const data = await request('/api/admin/courses');
    courses.splice(0, courses.length, ...data.items);
    renderCourses();
  }

  async function loadTracks() {
    const data = await request('/api/admin/tracks');
    tracks = data.items;
  }

  function openCourseForm(course = null) {
    editingCourse = course;
    const form = element('form', 'auth-form');
    form.style.maxWidth = '100%';
    const basic = element('div', 'card p-4 mb-4');
    basic.append(element('h4', 'font-medium mb-4 text-primary', 'Thông tin khóa học'));
    const title = input('course-title', 'Nhập tên khóa học...');
    title.required = true;
    const thumbnail = input('course-thumbnail', 'https://...');
    const identity = element('div', 'admin-form-grid');
    identity.append(field('Tên khóa học', title, 'form-group mb-0'), field('Link ảnh thumbnail', thumbnail, 'form-group mb-0'));
    const level = select('course-level', [['Cơ bản', 'Cơ bản'], ['Trung cấp', 'Trung cấp'], ['Nâng cao', 'Nâng cao']]);
    const duration = input('course-duration', 'Ví dụ: 8', 'number');
    duration.min = '1';
    const active = select('course-active', [['1', 'Hoạt động'], ['0', 'Tạm ẩn']]);
    const metadata = element('div', 'admin-form-grid mt-4');
    metadata.append(field('Cấp độ', level, 'form-group mb-0'), field('Thời lượng (giờ)', duration, 'form-group mb-0'), field('Trạng thái', active, 'form-group mb-0'));
    const description = input('course-description', 'Tóm tắt nội dung khóa học...', 'textarea');
    description.rows = 3;
    const descField = field('Mô tả khóa học', description, 'form-group mt-4 mb-0');
    basic.append(identity, metadata, descField);

    const mappings = element('div', 'card p-4');
    mappings.append(element('h4', 'font-medium mb-2 text-primary', 'Gán tiêu chí đánh giá'));
    mappings.append(element('p', 'text-sm text-muted mb-4', 'Khóa học có thể được gợi ý cho học viên dựa trên các tiêu chí được chọn.'));
    for (const track of tracks) {
      const group = element('div', 'criteria-group mb-3');
      group.append(element('div', 'font-medium text-sm mb-2 pb-1 border-bottom', `Ngành: ${track.name}`));
      const grid = element('div', 'checkbox-grid');
      for (const criterion of track.criteria) {
        const label = element('label', 'checkbox-item');
        const checkbox = element('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'course-criteria';
        checkbox.value = criterion.id;
        checkbox.checked = Boolean(course?.criteria.some((item) => item.id === criterion.id));
        label.append(checkbox, element('span', '', `${criterion.name} (${criterion.code})`));
        grid.append(label);
      }
      group.append(grid);
      mappings.append(group);
    }
    const error = element('p', 'text-sm text-red mt-3');
    error.id = 'course-form-error';
    error.setAttribute('role', 'alert');
    form.append(basic, mappings, error);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveCourse().catch((error) => setNotice(error.message, true));
    });
    modalBody.replaceChildren(form);
    if (course) {
      document.getElementById('course-title').value = course.title;
      document.getElementById('course-thumbnail').value = course.thumbnailUrl ?? '';
      document.getElementById('course-level').value = course.level;
      document.getElementById('course-duration').value = course.durationHours ?? '';
      document.getElementById('course-active').value = course.isActive ? '1' : '0';
      document.getElementById('course-description').value = course.description ?? '';
    }
    document.getElementById('course-modal').classList.add('show');
  }

  async function saveCourse() {
    const body = {
      title: document.getElementById('course-title').value.trim(),
      thumbnailUrl: document.getElementById('course-thumbnail').value.trim() || null,
      level: document.getElementById('course-level').value,
      durationHours: document.getElementById('course-duration').value
        ? Number(document.getElementById('course-duration').value)
        : null,
      isActive: document.getElementById('course-active').value === '1',
      description: document.getElementById('course-description').value.trim() || null,
      isDemo: editingCourse?.isDemo ?? false,
      criterionIds: [...document.querySelectorAll('input[name="course-criteria"]:checked')]
        .map((checkbox) => Number(checkbox.value))
    };
    const path = editingCourse ? `/api/admin/courses/${editingCourse.id}` : '/api/admin/courses';
    await request(path, { method: editingCourse ? 'PUT' : 'POST', body });
    closeModal('course-modal');
    setNotice(editingCourse ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học.');
    await loadCourses();
  }

  async function toggleCourse(course) {
    await request(`/api/admin/courses/${course.id}`, {
      method: 'PUT',
      body: {
        title: course.title,
        description: course.description,
        level: course.level,
        durationHours: course.durationHours,
        thumbnailUrl: course.thumbnailUrl,
        isActive: !course.isActive,
        isDemo: course.isDemo,
        criterionIds: course.criteria.map((criterion) => criterion.id)
      }
    });
    await loadCourses();
  }

  async function deleteCourse(course) {
    if (course.isDemo) return;
    if (!window.confirm(`Xóa khóa học "${course.title}"?`)) return;
    await request(`/api/admin/courses/${course.id}`, { method: 'DELETE' });
    setNotice('Đã xóa khóa học.');
    await loadCourses();
  }

  document.getElementById('course-add').addEventListener('click', () => openCourseForm());
  document.getElementById('course-save').addEventListener('click', () => {
    modalBody.querySelector('form')?.requestSubmit();
  });
  search.addEventListener('input', renderCourses);
  levelFilter.addEventListener('change', renderCourses);

  loadTracks()
    .then(loadCourses)
    .catch(() => {});
}
