const test = require('node:test');
const assert = require('node:assert/strict');
const {
  trackBody,
  criterionBody,
  caseBody,
  courseBody,
  caseListQuery,
  assessmentListQuery
} = require('../src/validators/admin.schemas');

test('admin track and rubric schemas accept valid sales and marketing data', () => {
  assert.equal(trackBody.safeParse({
    code: 'marketing',
    name: 'Marketing',
    description: 'Chiến dịch và nội dung',
    isActive: true
  }).success, true);

  assert.equal(criterionBody.safeParse({
    code: 'audienceInsight',
    name: 'Hiểu khách hàng mục tiêu',
    rubricLow: 'Không xác định được đối tượng.',
    rubricMid: 'Xác định được nhu cầu chung.',
    rubricHigh: 'Phân tích insight cụ thể và có căn cứ.',
    sortOrder: 1
  }).success, true);

  assert.equal(trackBody.safeParse({
    code: 'không hợp lệ',
    name: 'Tên ngành',
    isActive: true
  }).success, false);
});

test('admin case schema requires a real scenario and supported difficulty', () => {
  const validCase = {
    trackId: '1',
    title: 'Khách hàng so sánh giá',
    scenario: 'Khách hàng doanh nghiệp cho rằng giải pháp có giá cao hơn đối thủ và muốn lùi quyết định mua.',
    difficulty: 'Trung bình',
    isActive: true
  };
  assert.equal(caseBody.safeParse(validCase).success, true);
  assert.equal(caseBody.safeParse({ ...validCase, scenario: 'Quá ngắn' }).success, false);
  assert.equal(caseBody.safeParse({ ...validCase, difficulty: 'Rất khó' }).success, false);
  assert.equal(caseListQuery.safeParse({ query: { trackId: '1' } }).success, true);
});

test('admin assessment filters validate bounds, dates, and pagination', () => {
  assert.equal(assessmentListQuery.safeParse({
    query: {
      trackId: '2',
      minScore: '3.5',
      maxScore: '8',
      from: '2026-11-01',
      to: '2026-11-10',
      page: '2'
    }
  }).success, true);
  assert.equal(assessmentListQuery.safeParse({
    query: { minScore: '9', maxScore: '2' }
  }).success, false);
  assert.equal(assessmentListQuery.safeParse({
    query: { from: '2026-11-10', to: '2026-11-01' }
  }).success, false);
  assert.equal(assessmentListQuery.safeParse({
    query: { page: '0' }
  }).success, false);
});

test('admin course schema rejects duplicate mapped criteria', () => {
  const course = {
    title: 'Kỹ thuật xử lý từ chối',
    level: 'Trung cấp',
    isActive: true,
    isDemo: true,
    criterionIds: ['2', 3]
  };
  assert.equal(courseBody.safeParse(course).success, true);
  assert.equal(courseBody.safeParse({ ...course, criterionIds: [2, '2'] }).success, false);
});
