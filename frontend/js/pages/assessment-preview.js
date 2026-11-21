import { getUser } from '../auth.js';
import { api, difficultyBadge, element, showMessage } from '../public-data.js';

const params = new URLSearchParams(window.location.search);
const caseId = params.get('caseId');
const trackId = params.get('trackId');
const scenarioTitle = document.getElementById('scenario-title');
const scenarioDifficulty = document.getElementById('scenario-difficulty');
const scenarioContext = document.getElementById('scenario-context');
const scenarioStatus = document.getElementById('scenario-status');
const criteriaStatus = document.getElementById('criteria-status');
const criteriaList = document.getElementById('assessment-criteria');
const trackBreadcrumb = document.getElementById('track-breadcrumb');
const backLink = document.getElementById('back-to-cases');
const form = document.getElementById('assessment-form');
const answerInput = document.getElementById('assessment-answer');
const answerCounter = document.getElementById('answer-counter');
const submitButton = document.getElementById('assessment-submit');
const submissionStatus = document.getElementById('submission-status');
const gradingOverlay = document.getElementById('grading-overlay');
const MIN_ANSWER_LENGTH = 50;
const MAX_ANSWER_LENGTH = 3000;
let activeCaseId;

function updateAnswerCounter() {
  const length = answerInput.value.trim().length;
  answerCounter.textContent = `${answerInput.value.length} / ${MAX_ANSWER_LENGTH}`;
  answerCounter.classList.toggle('is-invalid', length > 0 && length < MIN_ANSWER_LENGTH);
  answerCounter.classList.toggle('is-valid', length >= MIN_ANSWER_LENGTH);
}

function renderCriteria(criteria) {
  criteriaList.replaceChildren();
  if (criteria.length === 0) {
    showMessage(criteriaStatus, 'Ngành này chưa có tiêu chí đánh giá.');
    return;
  }

  showMessage(criteriaStatus, '');
  for (const criterion of criteria) {
    const row = element('div', 'criteria-item');
    const icon = element('div', 'criteria-icon');
    icon.append(element('i', 'fa-solid fa-bullseye'));
    const details = element('div', 'criteria-info');
    details.append(
      element('h3', '', criterion.name),
      element('p', '', criterion.description || `Mã tiêu chí: ${criterion.code}`)
    );
    row.append(icon, details);
    criteriaList.append(row);
  }
}

async function loadScenario() {
  if (!caseId && !trackId) {
    scenarioTitle.textContent = 'Chưa chọn tình huống';
    scenarioContext.textContent = '';
    showMessage(scenarioStatus, 'Vui lòng chọn một tình huống từ danh sách.', true);
    return;
  }

  try {
    const [tracksResponse, caseItem] = await Promise.all([
      api('/api/tracks'),
      caseId
        ? api(`/api/cases/${encodeURIComponent(caseId)}`, { auth: true })
        : api(`/api/cases/random?trackId=${encodeURIComponent(trackId)}`, { auth: true })
    ]);

    activeCaseId = caseItem.id;
    const selectedTrackId = caseItem.trackId ?? trackId;
    const track = tracksResponse.items.find((item) => String(item.id) === String(selectedTrackId));
    if (!track) {
      throw new Error('Không tìm thấy thông tin ngành nghề của tình huống.');
    }

    scenarioTitle.textContent = caseItem.title;
    scenarioContext.textContent = caseItem.scenario;
    scenarioDifficulty.replaceWith(difficultyBadge(caseItem.difficulty));
    document.title = `Làm bài: ${caseItem.title} - Skill_Network`;
    trackBreadcrumb.textContent = track.name;
    trackBreadcrumb.href = `tracks.html?trackId=${encodeURIComponent(track.id)}`;
    backLink.href = trackBreadcrumb.href;
    renderCriteria(track.criteria);

    if (getUser()?.role !== 'student') {
      showMessage(submissionStatus, 'Chỉ tài khoản học viên mới có thể nộp bài đánh giá.', true);
      return;
    }

    answerInput.disabled = false;
    submitButton.disabled = false;
    showMessage(scenarioStatus, '');
  } catch (error) {
    scenarioTitle.textContent = 'Không thể tải tình huống';
    scenarioContext.textContent = '';
    showMessage(scenarioStatus, error.message || 'Không thể tải dữ liệu tình huống.', true);
  }
}

answerInput.addEventListener('input', updateAnswerCounter);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const answer = answerInput.value.trim();
  if (answer.length < MIN_ANSWER_LENGTH || answer.length > MAX_ANSWER_LENGTH) {
    showMessage(
      submissionStatus,
      `Câu trả lời cần có từ ${MIN_ANSWER_LENGTH} đến ${MAX_ANSWER_LENGTH} ký tự.`,
      true
    );
    answerInput.focus();
    return;
  }

  submitButton.disabled = true;
  answerInput.disabled = true;
  showMessage(submissionStatus, '');
  gradingOverlay.hidden = false;
  document.body.classList.add('grading-in-progress');

  try {
    const result = await api('/api/assessments', {
      method: 'POST',
      auth: true,
      body: { caseId: activeCaseId, answer }
    });
    if (result.saved === false) {
      sessionStorage.setItem('skill_network_demo_result', JSON.stringify(result));
      window.location.assign('result.html?demo=1');
      return;
    }
    window.location.assign(`result.html?id=${encodeURIComponent(result.assessmentId)}`);
  } catch (error) {
    gradingOverlay.hidden = true;
    document.body.classList.remove('grading-in-progress');
    answerInput.disabled = false;
    submitButton.disabled = false;
    showMessage(submissionStatus, error.message || 'Không thể nộp bài. Vui lòng thử lại.', true);
  }
});

updateAnswerCounter();
loadScenario();
