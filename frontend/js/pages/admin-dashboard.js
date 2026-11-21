import { getUser } from '../auth.js';
import { bindLogout, guardAdminPage, request } from './admin-common.js';

if (guardAdminPage()) {
  const greeting = document.querySelector('.admin-profile strong');
  const user = getUser();
  if (greeting && user?.fullName) greeting.textContent = user.fullName;
  bindLogout();

  function renderCharts(stats) {
    if (typeof window.Chart !== 'function') return;
    window.Chart.defaults.font.family = 'Inter';

    const submissionsCanvas = document.getElementById('submissionsChart');
    if (submissionsCanvas) {
      const context = submissionsCanvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
      new window.Chart(context, {
        type: 'line',
        data: {
          labels: stats.last7Days.map(({ date }) => {
            const [, month, day] = date.split('-');
            return `${day}/${month}`;
          }),
          datasets: [{
            label: 'Số lượng bài nộp',
            data: stats.last7Days.map(({ count }) => count),
            borderColor: '#4f46e5',
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#4f46e5',
            pointBorderWidth: 2,
            pointRadius: 4,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { borderDash: [5, 5], color: '#e5e7eb' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    const scoresCanvas = document.getElementById('scoresChart');
    if (scoresCanvas) {
      new window.Chart(scoresCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: stats.avgScoreByTrack.map(({ trackName }) => trackName),
          datasets: [{
            label: 'Điểm Trung Bình',
            data: stats.avgScoreByTrack.map(({ avg }) => avg),
            backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
            borderRadius: 6,
            barThickness: 24
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { min: 0, max: 10, grid: { borderDash: [5, 5], color: '#e5e7eb' } },
            y: { grid: { display: false } }
          }
        }
      });
    }
  }

  async function loadDashboard() {
    const stats = await request('/api/admin/stats');
    document.getElementById('total-students').textContent =
      stats.totalStudents.toLocaleString('vi-VN');
    document.getElementById('total-assessments').textContent =
      stats.totalAssessments.toLocaleString('vi-VN');
    document.getElementById('average-score').textContent =
      stats.averageScore === null ? '—' : stats.averageScore.toFixed(1);
    renderCharts(stats);
  }

  loadDashboard().catch(() => {});
}
