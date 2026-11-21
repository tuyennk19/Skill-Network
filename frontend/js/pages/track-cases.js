import { getToken, getUser } from '../auth.js';
import { api, difficultyBadge, element, showMessage } from '../public-data.js';

const trackSelect = document.getElementById('track-select');
const trackDescription = document.getElementById('track-description');
const casesList = document.getElementById('cases-list');
const casesStatus = document.getElementById('cases-status');
const casesHeading = document.getElementById('cases-heading');
const randomLink = document.getElementById('random-case-link');
const authLink = document.getElementById('track-auth-link');
const requestedTrackId = new URLSearchParams(window.location.search).get('trackId');
let tracks = [];

function syncSelectedTrack() {
  const track = tracks.find((item) => String(item.id) === trackSelect.value);
  if (!track) return;

  trackDescription.textContent = track.description || '';
  casesHeading.textContent = `Tình huống đang mở · ${track.name}`;
  const destination = `assessment.html?trackId=${encodeURIComponent(track.id)}&mode=random`;
  randomLink.href = getToken()
    ? destination
    : `login.html?next=${encodeURIComponent(`/${destination}`)}`;
}

function renderCases(items) {
  casesList.replaceChildren();
  casesHeading.textContent = `Tình huống đang mở · ${tracks.find((track) => String(track.id) === trackSelect.value)?.name ?? ''} (${items.length})`;
  if (items.length === 0) {
    showMessage(casesStatus, 'Ngành này chưa có tình huống nào đang mở.');
    return;
  }

  showMessage(casesStatus, '');
  for (const item of items) {
    const card = element('article', 'card case-card');
    const header = element('div', 'case-card-header');
    header.append(difficultyBadge(item.difficulty));
    const body = element('div', 'case-card-body');
    body.append(element('h3', 'card-title', item.title));
    body.append(element('p', 'card-desc', 'Đọc tình huống, trình bày phương án xử lý và nhận đánh giá năng lực.'));
    const footer = element('div', 'case-card-footer');
    const link = element('a', 'btn btn-outline btn-block', 'Bắt đầu làm bài');
    link.href = `assessment.html?caseId=${encodeURIComponent(item.id)}`;
    footer.append(link);
    card.append(header, body, footer);
    casesList.append(card);
  }
}

async function loadCases() {
  casesList.replaceChildren();
  if (!getToken()) {
    showMessage(casesStatus, 'Đăng nhập để xem các tình huống và bối cảnh của ngành nghề này.');
    return;
  }

  showMessage(casesStatus, 'Đang tải tình huống...');
  try {
    const { items } = await api(`/api/cases?trackId=${encodeURIComponent(trackSelect.value)}`, { auth: true });
    renderCases(items);
  } catch (error) {
    showMessage(casesStatus, error.message || 'Không thể tải tình huống.', true);
  }
}

async function initialize() {
  try {
    const { items } = await api('/api/tracks');
    tracks = items;
    trackSelect.replaceChildren();
    for (const track of tracks) {
      const option = element('option', '', track.name);
      option.value = track.id;
      trackSelect.append(option);
    }

    const selected = tracks.find((track) => String(track.id) === requestedTrackId) ?? tracks[0];
    if (!selected) {
      showMessage(casesStatus, 'Hiện chưa có ngành nghề nào đang mở.');
      randomLink.hidden = true;
      return;
    }

    trackSelect.value = selected.id;
    const user = getUser();
    if (user) {
      authLink.href = 'profile.html';
      authLink.textContent = 'Hồ sơ';
    } else {
      authLink.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      authLink.textContent = 'Đăng nhập';
    }
    syncSelectedTrack();
    await loadCases();
  } catch (error) {
    showMessage(casesStatus, error.message || 'Không thể tải ngành nghề.', true);
  }
}

trackSelect.addEventListener('change', () => {
  const params = new URLSearchParams(window.location.search);
  params.set('trackId', trackSelect.value);
  window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  syncSelectedTrack();
  loadCases();
});

initialize();
