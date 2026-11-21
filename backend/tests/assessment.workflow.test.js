const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const assessmentModel = require('../src/models/assessment.model');
const caseModel = require('../src/models/case.model');
const { validateAiResult } = require('../src/services/ai/aiResult.validator');
const { submitAssessmentSchema, assessmentIdSchema } = require('../src/validators/assessment.schemas');
const HttpError = require('../src/utils/httpError');

test('assessment request schemas validate student input and IDs', () => {
  assert.equal(
    submitAssessmentSchema.safeParse({
      body: { caseId: '4', answer: 'A sufficiently long answer.' }
    }).success,
    true
  );
  assert.equal(
    submitAssessmentSchema.safeParse({
      body: { caseId: '0', answer: 'Answer', unexpected: true }
    }).success,
    false
  );
  assert.equal(assessmentIdSchema.safeParse({ params: { id: '9' } }).success, true);
  assert.equal(assessmentIdSchema.safeParse({ params: { id: 'bad' } }).success, false);
});

test('active assessment case query joins its active track and ordered rubrics', async (t) => {
  t.mock.method(pool, 'execute', async (sql, values) => {
    assert.match(sql, /c\.is_active = 1 AND t\.is_active = 1/);
    assert.match(sql, /ORDER BY tc\.sort_order, tc\.id/);
    assert.deepEqual(values, [7]);
    return [[{
      caseId: 7,
      caseTitle: 'Giá cao',
      scenario: 'Tình huống',
      trackId: 2,
      trackName: 'Sales',
      criterionId: 15,
      criterionCode: 'empathy',
      criterionName: 'Đồng cảm',
      criterionDescription: 'Lắng nghe',
      rubricLow: 'Thấp',
      rubricMid: 'Đạt',
      rubricHigh: 'Tốt'
    }]];
  });

  assert.deepEqual(await caseModel.findActiveForAssessment(7), {
    id: 7,
    title: 'Giá cao',
    scenario: 'Tình huống',
    trackId: 2,
    trackName: 'Sales',
    criteria: [{
      id: 15,
      code: 'empathy',
      name: 'Đồng cảm',
      description: 'Lắng nghe',
      rubricLow: 'Thấp',
      rubricMid: 'Đạt',
      rubricHigh: 'Tốt'
    }]
  });
});

test('assessment save commits scores and recommendations in one transaction', async (t) => {
  const statements = [];
  const connection = {
    async beginTransaction() {
      statements.push('BEGIN');
    },
    async execute(sql, values) {
      statements.push({ sql, values });
      if (sql.includes('INSERT INTO assessments')) {
        return [{ insertId: 42 }];
      }
      if (sql.includes('SELECT c.id AS courseId')) {
        return [[{
          courseId: 5,
          title: 'Lắng nghe',
          level: 'Cơ bản',
          criterionId: 15,
          criterionCode: 'empathy',
          criterionName: 'Đồng cảm'
        }]];
      }
      if (sql.includes('SELECT created_at')) {
        return [[{ createdAt: new Date('2026-10-30T12:00:00.000Z') }]];
      }
      return [{ affectedRows: 1 }];
    },
    async commit() {
      statements.push('COMMIT');
    },
    async rollback() {
      statements.push('ROLLBACK');
    },
    release() {
      statements.push('RELEASE');
    }
  };
  t.mock.method(pool, 'getConnection', async () => connection);

  const result = await assessmentModel.createAssessment({
    userId: 3,
    caseId: 7,
    trackId: 2,
    answer: 'Đã làm sạch câu trả lời.',
    result: { overallScore: 5, strengths: [], weaknesses: [], focusTopics: [], advice: [] },
    isMock: false,
    criteria: [{
      id: 15,
      code: 'empathy',
      name: 'Đồng cảm',
      score: 5,
      comment: 'Cần làm rõ nhu cầu.'
    }]
  });

  assert.equal(result.assessmentId, 42);
  assert.equal(result.createdAt, '2026-10-30T12:00:00.000Z');
  assert.equal(result.recommendations.length, 1);
  assert.ok(statements.some((statement) =>
    typeof statement === 'object' && statement.sql.includes('INSERT INTO assessment_scores')
  ));
  assert.ok(statements.some((statement) =>
    typeof statement === 'object' && statement.sql.includes('INSERT INTO recommendations')
  ));
  assert.equal(statements.at(-2), 'COMMIT');
  assert.equal(statements.at(-1), 'RELEASE');
});

test('assessment transaction rolls back when writing a score fails', async (t) => {
  const statements = [];
  const connection = {
    async beginTransaction() {
      statements.push('BEGIN');
    },
    async execute(sql) {
      statements.push(sql);
      if (sql.includes('INSERT INTO assessments')) return [{ insertId: 42 }];
      if (sql.includes('assessment_scores')) throw new Error('simulated score insert failure');
      return [[]];
    },
    async commit() {
      statements.push('COMMIT');
    },
    async rollback() {
      statements.push('ROLLBACK');
    },
    release() {
      statements.push('RELEASE');
    }
  };
  t.mock.method(pool, 'getConnection', async () => connection);

  await assert.rejects(
    assessmentModel.createAssessment({
      userId: 3,
      caseId: 7,
      trackId: 2,
      answer: 'Đã làm sạch câu trả lời.',
      result: { overallScore: 5, strengths: [], weaknesses: [], focusTopics: [], advice: [] },
      isMock: false,
      criteria: [{ id: 15, code: 'empathy', name: 'Đồng cảm', score: 5, comment: 'Nhận xét' }]
    }),
    /simulated score insert failure/
  );
  assert.ok(statements.includes('ROLLBACK'));
  assert.ok(!statements.includes('COMMIT'));
  assert.equal(statements.at(-1), 'RELEASE');
});

test('assessment detail lookup always scopes the query to its owner', async (t) => {
  const calls = [];
  t.mock.method(pool, 'execute', async (sql, values) => {
    calls.push({ sql, values });
    if (calls.length === 1) {
      return [[{
        id: 42,
        trackId: 2,
        caseId: 7,
        overallScore: '5.00',
        resultJson: {
          strengths: [],
          weaknesses: ['Cần luyện thêm.'],
          focusTopics: ['Đàm phán', 'Lắng nghe'],
          advice: ['Đặt câu hỏi.']
        },
        isMock: 1,
        createdAt: new Date('2026-10-30T12:00:00.000Z'),
        caseTitle: 'Giá cao',
        trackName: 'Sales'
      }]];
    }
    if (calls.length === 2) {
      return [[{
        code: 'empathy',
        name: 'Đồng cảm',
        score: '5.00',
        comment: 'Cần làm rõ nhu cầu.'
      }]];
    }
    return [[]];
  });

  const assessment = await assessmentModel.getById(3, 42);
  assert.deepEqual(calls[0].values, [3, 42]);
  assert.match(calls[0].sql, /WHERE a\.user_id = \? AND a\.id = \?/);
  assert.equal(assessment.isMock, true);
  assert.equal(assessment.criteria[0].score, 5);
  assert.equal(assessment.answer, undefined);
});

test('admin assessment listing applies parameterized filters and pagination', async (t) => {
  const calls = [];
  t.mock.method(pool, 'execute', async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes('COUNT(*) AS total')) return [[{ total: 21 }]];
    return [[{
      id: 42,
      fullName: 'Học viên',
      email: 'student@example.test',
      caseTitle: 'Tình huống',
      trackName: 'Sales',
      overallScore: '7.50',
      createdAt: new Date('2026-11-10T12:00:00.000Z'),
      isMock: 0
    }]];
  });

  const result = await assessmentModel.getAdminList({
    trackId: 2,
    minScore: 4,
    maxScore: 9,
    from: '2026-11-01',
    to: '2026-11-10',
    page: 2
  });

  assert.equal(calls.length, 2);
  assert.ok(calls.every(({ sql }) => sql.includes('a.track_id = ?')));
  assert.deepEqual(calls[0].values, [
    2, 2, 4, 4, 9, 9, '2026-11-01', '2026-11-01', '2026-11-10', '2026-11-10'
  ]);
  assert.equal(calls[1].values.at(-2), 20);
  assert.equal(calls[1].values.at(-1), 20);
  assert.equal(result.items[0].overallScore, 7.5);
  assert.equal(result.items[0].isMock, false);
  assert.deepEqual(result.pagination, {
    page: 2,
    pageSize: 20,
    total: 21,
    totalPages: 2
  });
});

test('admin assessment detail returns student answer and validated score data', async (t) => {
  const calls = [];
  t.mock.method(pool, 'execute', async (sql, values) => {
    calls.push({ sql, values });
    if (calls.length === 1) {
      return [[{
        id: 42,
        fullName: 'Học viên',
        email: 'student@example.test',
        caseTitle: 'Tình huống',
        scenario: 'Nội dung tình huống.',
        trackName: 'Sales',
        answer: 'Câu trả lời thực tế.',
        overallScore: '7.50',
        resultJson: { strengths: ['Tốt'], weaknesses: ['Cần cải thiện'], focusTopics: ['Đàm phán'], advice: ['Luyện tập'] },
        isMock: 0,
        createdAt: new Date('2026-11-10T12:00:00.000Z')
      }]];
    }
    return [[{
      code: 'empathy',
      name: 'Đồng cảm',
      score: '8.00',
      comment: 'Nhận xét thật.'
    }]];
  });

  const result = await assessmentModel.getAdminById(42);

  assert.deepEqual(calls[0].values, [42]);
  assert.match(calls[0].sql, /a\.answer/);
  assert.equal(result.answer, 'Câu trả lời thực tế.');
  assert.equal(result.overallScore, 7.5);
  assert.equal(result.criteria[0].score, 8);
  assert.deepEqual(result.resultJson.focusTopics, ['Đàm phán']);
});

test('admin dashboard stats aggregate persisted users, assessments, tracks, and days', async (t) => {
  t.mock.method(pool, 'execute', async (sql) => {
    if (sql.includes("role = 'student'")) return [[{ total: 12 }]];
    if (sql.includes('AVG(overall_score) AS averageScore') && sql.includes('COUNT(*) AS total')) {
      return [[{ total: 31, averageScore: '6.75' }]];
    }
    if (sql.includes('GROUP BY t.id, t.name')) {
      return [[{ trackName: 'Sales', averageScore: '7.25' }]];
    }
    if (sql.includes('WITH RECURSIVE date_range')) {
      return [[
        { date: '2026-11-11', count: 2 },
        { date: '2026-11-12', count: 0 }
      ]];
    }
    throw new Error('Unexpected statistics query');
  });

  const stats = await assessmentModel.getAdminStats();

  assert.equal(stats.totalStudents, 12);
  assert.equal(stats.totalAssessments, 31);
  assert.equal(stats.averageScore, 6.75);
  assert.deepEqual(stats.avgScoreByTrack, [{ trackName: 'Sales', avg: 7.25 }]);
  assert.deepEqual(stats.last7Days, [
    { date: '2026-11-11', count: 2 },
    { date: '2026-11-12', count: 0 }
  ]);
});

test('off-topic AI results are rejected before an assessment can be saved', () => {
  assert.throws(
    () => validateAiResult({
      overallScore: 0,
      criteria: [{ code: 'empathy', score: 0, comment: 'Lạc đề.' }],
      strengths: [],
      weaknesses: [],
      focusTopics: [],
      advice: [],
      isOffTopic: true,
      offTopicReason: 'Lạc đề.'
    }, [{ id: 15, code: 'empathy', name: 'Đồng cảm' }]),
    (error) => error instanceof HttpError && error.status === 422
  );
});
