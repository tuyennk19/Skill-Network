import { api } from '../api.js';
import { courseCard, element, showMessage } from '../public-data.js';

const assessmentId = new URLSearchParams(window.location.search).get('id');
const status = document.getElementById('result-status');
const content = document.getElementById('result-content');

function scoreClass(score) {
  if (score >= 7) return 'text-green';
  if (score >= 5) return 'text-yellow';
  return 'text-red';
}

function renderList(target, items, emptyMessage) {
  target.replaceChildren();
  if (!items.length) {
    target.append(element('li', '', emptyMessage));
    return;
  }
  for (const item of items) target.append(element('li', '', item));
}

function renderCriteria(criteria) {
  const list = document.getElementById('criteria-scores');
  list.replaceChildren();
  for (const criterion of criteria) {
    const item = element('article', 'criteria-score-item');
    const header = element('div', 'criteria-score-header');
    const name = element('span', 'criteria-name', criterion.name);
    const score = element('span', `criteria-point ${scoreClass(criterion.score)}`, `${criterion.score}/10`);
    const progress = element('div', 'progress-bar-bg');
    const fillClass = criterion.score >= 7 ? 'bg-green' : criterion.score >= 5 ? 'bg-yellow' : 'bg-red';
    const fill = element('div', `progress-bar-fill ${fillClass}`);
    fill.style.width = `${criterion.score * 10}%`;
    fill.setAttribute('aria-label', `${criterion.score} trên 10`);
    progress.append(fill);
    header.append(name, score);
    item.append(header, progress, element('p', 'criteria-comment', criterion.comment));
    list.append(item);
  }
}

function renderRecommendations(recommendations) {
  const list = document.getElementById('recommendations-list');
  const empty = document.getElementById('recommendations-empty');
  list.replaceChildren();
  if (!recommendations.length) {
    showMessage(empty, 'Bạn đã đạt yêu cầu ở mọi tiêu chí hoặc hiện chưa có khóa học phù hợp.');
    return;
  }

  showMessage(empty, '');
  for (const recommendation of recommendations) {
    const card = courseCard({
      id: recommendation.courseId,
      title: recommendation.title,
      description: recommendation.reason,
      level: 'Gợi ý'
    });
    const link = element('a', 'btn btn-outline btn-sm recommendation-link', 'Xem khóa học');
    link.href = `course-detail.html?id=${encodeURIComponent(recommendation.courseId)}`;
    card.querySelector('.course-body').append(link);
    list.append(card);
  }
}

function renderChart(criteria) {
  const canvas = document.getElementById('radarChart');
  if (typeof window.Chart !== 'function') {
    canvas.hidden = true;
    canvas.parentElement.append(element('p', 'data-status', 'Không tải được biểu đồ; điểm chi tiết vẫn được hiển thị bên dưới.'));
    return;
  }

  new window.Chart(canvas, {
    type: 'radar',
    data: {
      labels: criteria.map((criterion) => criterion.name),
      datasets: [{
        label: 'Điểm của bạn',
        data: criteria.map((criterion) => criterion.score),
        backgroundColor: 'rgba(79, 70, 229, 0.18)',
        borderColor: '#4f46e5',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, backdropColor: 'transparent' },
          pointLabels: { color: '#4b5563', font: { family: 'Inter', weight: '600' } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderResult(result) {
  document.title = `Báo cáo: ${result.caseTitle} - Skill_Network`;
  document.getElementById('result-track').textContent = `Ngành: ${result.trackName}`;
  document.getElementById('result-case').textContent = result.caseTitle;
  document.getElementById('result-date').textContent = `Hoàn thành lúc ${new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date(result.createdAt))}`;
  document.getElementById('overall-score').textContent = Number(result.overallScore).toFixed(1);
  const ring = document.getElementById('score-ring');
  ring.style.strokeDashoffset = String(326.7 * (1 - Number(result.overallScore) / 10));
  ring.setAttribute('stroke', Number(result.overallScore) >= 7
    ? '#059669'
    : Number(result.overallScore) >= 5 ? '#d97706' : '#dc2626');
  document.getElementById('mock-banner').hidden = !result.isMock;

  renderCriteria(result.criteria);
  renderList(document.getElementById('result-strengths'), result.strengths, 'Chưa có nhận xét điểm mạnh.');
  renderList(document.getElementById('result-weaknesses'), result.weaknesses, 'Chưa có nhận xét điểm cần cải thiện.');
  renderList(document.getElementById('result-advice'), result.advice, 'Chưa có lời khuyên hành động.');

  const focus = document.getElementById('result-focus');
  focus.replaceChildren();
  for (const topic of result.focusTopics) focus.append(element('span', 'focus-tag', topic));

  const weakCount = result.criteria.filter((criterion) => criterion.score < 6).length;
  document.getElementById('recommendation-summary').textContent = weakCount
    ? 'Các khóa học được gợi ý dựa trên tiêu chí cần cải thiện.'
    : 'Bạn đã đạt từ 6/10 ở tất cả tiêu chí.';
  renderRecommendations(result.recommendations);
  renderChart(result.criteria);

  status.hidden = true;
  content.hidden = false;
}

function renderDemoResult(result) {
  renderResult({
    ...result,
    isMock: true
  });
  const banner = document.getElementById('mock-banner');
  banner.hidden = false;
  banner.querySelector('.container').replaceChildren();
  banner.querySelector('.container').append(
    element('i', 'fa-solid fa-circle-info'),
    element('strong', '', ' Kết quả mẫu không lưu: '),
    element('span', '', 'AI hiện không khả dụng nên kết quả chỉ dùng để minh họa.')
  );
}

async function loadResult() {
  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    try {
      const result = JSON.parse(sessionStorage.getItem('skill_network_demo_result') || 'null');
      if (!result) {
        showMessage(status, 'Không tìm thấy kết quả mẫu trong phiên hiện tại.', true);
        return;
      }
      renderDemoResult(result);
      sessionStorage.removeItem('skill_network_demo_result');
      return;
    } catch {
      showMessage(status, 'Không thể đọc kết quả mẫu.', true);
      return;
    }
  }

  if (!assessmentId || !/^\d+$/.test(assessmentId)) {
    showMessage(status, 'Đường dẫn báo cáo không hợp lệ.', true);
    return;
  }

  try {
    const result = await api(`/api/assessments/${encodeURIComponent(assessmentId)}`, { auth: true });
    renderResult(result);
  } catch (error) {
    showMessage(status, error.message || 'Không thể tải báo cáo đánh giá.', true);
  }
}

loadResult();
