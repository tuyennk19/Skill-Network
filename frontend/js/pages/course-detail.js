import { api, element, showMessage } from '../public-data.js';

const params = new URLSearchParams(window.location.search);
const courseId = params.get('id');
const status = document.getElementById('course-status');
const title = document.getElementById('course-title');
const description = document.getElementById('course-description');
const criteriaList = document.getElementById('course-criteria-list');
const emptyCriteria = document.getElementById('course-criteria-empty');
const image = document.getElementById('course-image');

async function loadCourse() {
  if (!courseId || !/^\d+$/.test(courseId)) {
    title.textContent = 'Không tìm thấy khóa học';
    showMessage(status, 'Vui lòng chọn khóa học từ thư viện.', true);
    return;
  }

  try {
    const course = await api(`/api/courses/${encodeURIComponent(courseId)}`);
    title.textContent = course.title;
    const courseDescription = course.description && !/^dữ liệu demo$/i.test(course.description.trim())
      ? course.description
      : 'Mô tả đang được cập nhật.';
    description.textContent = courseDescription;
    document.getElementById('course-overview').textContent =
      courseDescription;
    document.getElementById('course-level').textContent = course.level;
    document.getElementById('course-level-sidebar').textContent = course.level;
    document.getElementById('course-duration').textContent = course.durationHours
      ? `Thời lượng tham khảo: ${course.durationHours} giờ`
      : 'Thời lượng đang được cập nhật';
    document.getElementById('course-duration-sidebar').textContent =
      course.durationHours ? `${course.durationHours} giờ` : 'Chưa cập nhật';
    document.getElementById('course-level-badge').textContent = course.level;

    const trackNames = [...new Set(course.criteria.map((criterion) => criterion.trackName).filter(Boolean))];
    document.getElementById('course-track').textContent = trackNames.length
      ? trackNames.join(', ')
      : 'Chưa phân loại';
    document.getElementById('course-criteria-sidebar').textContent = course.criteria.length
      ? String(course.criteria.length)
      : 'Chưa có';
    document.getElementById('course-image-caption').textContent =
      trackNames.length ? `Thư viện kỹ năng · ${trackNames.join(', ')}` : 'Thư viện kỹ năng';

    if (course.thumbnailUrl) {
      image.src = course.thumbnailUrl;
      image.alt = course.title;
      image.hidden = false;
      image.addEventListener('error', () => {
        image.hidden = true;
      }, { once: true });
    }

    if (course.isDemo) {
      const demoLabel = element('span', 'course-demo-label', 'Dữ liệu mẫu');
      document.querySelector('.course-catalog-note').append(demoLabel);
    }

    criteriaList.replaceChildren();
    emptyCriteria.hidden = course.criteria.length > 0;
    for (const criterion of course.criteria) {
      const row = element('div', 'criteria-item');
      const icon = element('div', 'criteria-icon');
      icon.append(element('i', 'fa-solid fa-bullseye'));
      const details = element('div', 'criteria-info');
      details.append(
        element('h4', '', `${criterion.name} (${criterion.code})`),
        element('p', '', criterion.description || `Ngành nghề: ${criterion.trackName}`)
      );
      row.append(icon, details);
      criteriaList.append(row);
    }

    document.title = `${course.title} - Skill_Network`;
    showMessage(status, '');
  } catch (error) {
    title.textContent = 'Không thể tải khóa học';
    showMessage(status, error.message || 'Không thể tải dữ liệu khóa học.', true);
  }
}

loadCourse();
