import { api, courseCard, element, showMessage } from '../public-data.js';

const tracksContainer = document.getElementById('tracks-list');
const tracksStatus = document.getElementById('tracks-status');
const coursesContainer = document.getElementById('featured-courses');
const coursesStatus = document.getElementById('featured-courses-status');
const trackStyles = [
  ['bg-blue-light', 'text-blue', 'fa-solid fa-briefcase'],
  ['bg-purple-light', 'text-purple', 'fa-solid fa-bullhorn'],
  ['bg-green-light', 'text-green', 'fa-solid fa-headset']
];

async function loadTracks() {
  try {
    const { items } = await api('/api/tracks');
    tracksContainer.replaceChildren();
    if (items.length === 0) {
      showMessage(tracksStatus, 'Hiện chưa có ngành nghề nào đang mở.');
      return;
    }

    showMessage(tracksStatus, '');
    items.forEach((track, index) => {
      const card = element('article', 'card track-card');
      const [iconBackground, iconColor, iconClass] = trackStyles[index % trackStyles.length];
      const icon = element('div', `card-icon-wrapper ${iconBackground}`);
      icon.append(element('i', `${iconClass} ${iconColor}`));
      const title = element('h3', 'card-title', track.name);
      const description = element(
        'p',
        'card-desc',
        track.description || 'Thông tin ngành nghề đang được cập nhật.'
      );
      const skills = element('p', 'track-skill-summary');
      skills.textContent = track.criteria.length
        ? `Đánh giá ${track.criteria.length} tiêu chí: ${track.criteria.map((criterion) => criterion.name).join(', ')}`
        : 'Tiêu chí đánh giá đang được cập nhật.';
      const footer = element('div', 'card-footer');
      const count = element('span', 'meta-info');
      count.append(element('i', 'fa-solid fa-list-check'), document.createTextNode(` ${track.criteria.length} tiêu chí`));
      const link = element('a', 'btn-link', 'Xem tình huống');
      link.href = `tracks.html?trackId=${encodeURIComponent(track.id)}`;
      link.append(element('i', 'fa-solid fa-arrow-right'));
      footer.append(count, link);
      card.append(icon, title, description, skills, footer);
      tracksContainer.append(card);
    });
  } catch (error) {
    showMessage(tracksStatus, error.message || 'Không thể tải danh sách ngành nghề.', true);
  }
}

async function loadFeaturedCourses() {
  try {
    const { items } = await api('/api/courses?limit=3');
    coursesContainer.replaceChildren();
    if (items.length === 0) {
      showMessage(coursesStatus, 'Hiện chưa có khóa học nào đang mở.');
      return;
    }

    showMessage(coursesStatus, '');
    items.forEach((course) => coursesContainer.append(courseCard(course)));
  } catch (error) {
    showMessage(coursesStatus, error.message || 'Không thể tải khóa học.', true);
  }
}

loadTracks();
loadFeaturedCourses();
