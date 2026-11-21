const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const trackModel = require('../src/models/track.model');
const courseModel = require('../src/models/course.model');
const caseModel = require('../src/models/case.model');
const {
  idParams,
  courseListQuery,
  caseTrackQuery
} = require('../src/validators/publicData.schemas');

test('public-data schemas apply pagination defaults and reject invalid IDs', () => {
  const query = courseListQuery.safeParse({ query: {} });
  assert.equal(query.success, true);
  assert.deepEqual(query.data.query, {
    search: '',
    level: '',
    page: 1,
    limit: 12
  });
  assert.equal(
    courseListQuery.safeParse({ query: { page: '0', limit: '101' } }).success,
    false
  );
  assert.equal(idParams.safeParse({ params: { id: '2' } }).success, true);
  assert.equal(idParams.safeParse({ params: { id: '0' } }).success, false);
  assert.equal(caseTrackQuery.safeParse({ query: { trackId: '4' } }).success, true);
  assert.equal(caseTrackQuery.safeParse({ query: {} }).success, false);
});

test('track model groups criteria without exposing rubric fields', async (t) => {
  const rows = [
    {
      id: 2, code: 'sales_b2b', name: 'Bán hàng B2B', description: 'Mô tả',
      criterionId: 5, criterionCode: 'empathy', criterionName: 'Đồng cảm',
      criterionDescription: 'Lắng nghe'
    },
    {
      id: 2, code: 'sales_b2b', name: 'Bán hàng B2B', description: 'Mô tả',
      criterionId: 6, criterionCode: 'closing', criterionName: 'Chốt sale',
      criterionDescription: 'Cam kết'
    }
  ];
  t.mock.method(pool, 'execute', async (sql, values = []) => {
    assert.match(sql, /WHERE t\.is_active = 1/);
    assert.deepEqual(values, []);
    return [rows];
  });

  assert.deepEqual(await trackModel.findActiveWithCriteria(), [{
    id: 2,
    code: 'sales_b2b',
    name: 'Bán hàng B2B',
    description: 'Mô tả',
    criteria: [
      { id: 5, code: 'empathy', name: 'Đồng cảm', description: 'Lắng nghe' },
      { id: 6, code: 'closing', name: 'Chốt sale', description: 'Cam kết' }
    ]
  }]);
});

test('course model applies parameterized filters and pagination', async (t) => {
  let callCount = 0;
  t.mock.method(pool, 'execute', async (sql, values) => {
    callCount += 1;
    assert.match(sql, /c\.is_active = 1/);
    assert.match(sql, /search_tc\.name LIKE \? OR search_tc\.code LIKE \?/);
    if (callCount === 2) {
      assert.match(sql, /c\.is_demo AS isDemo/);
    }
    assert.equal((sql.match(/\?/g) || []).length, values.length);

    if (callCount === 1) {
      assert.deepEqual(values, [
        "O'Brien", "%O'Brien%", "%O'Brien%", "%O'Brien%", "%O'Brien%",
        'Cơ bản', 'Cơ bản', 3, 3
      ]);
      return [[{ total: 14 }]];
    }

    assert.match(sql, /LIMIT \? OFFSET \?/);
    assert.deepEqual(values, [
      "O'Brien", "%O'Brien%", "%O'Brien%", "%O'Brien%", "%O'Brien%",
      'Cơ bản', 'Cơ bản', 3, 3, 5, 10
    ]);
    return [[{
      id: 8,
      title: 'Lắng nghe',
      description: 'Mô tả',
      level: 'Cơ bản',
      durationHours: 3,
      thumbnailUrl: null,
      isDemo: true
    }]];
  });

  assert.deepEqual(await courseModel.findPage({
    search: "O'Brien",
    level: 'Cơ bản',
    trackId: 3,
    limit: 5,
    offset: 10
  }), {
    items: [{
      id: 8,
      title: 'Lắng nghe',
      description: 'Mô tả',
      level: 'Cơ bản',
      durationHours: 3,
      thumbnailUrl: null,
      isDemo: true
    }],
    total: 14
  });
});

test('course detail converts the demo flag to a boolean', async (t) => {
  t.mock.method(pool, 'execute', async (sql, values) => {
    assert.match(sql, /c\.is_demo AS isDemo/);
    assert.deepEqual(values, [8]);
    return [[{
      id: 8,
      title: 'Khóa mẫu',
      description: 'Mô tả',
      level: 'Cơ bản',
      durationHours: 3,
      thumbnailUrl: null,
      isDemo: 1,
      criterionId: null,
      criterionCode: null,
      criterionName: null,
      criterionDescription: null,
      trackId: null,
      trackName: null
    }]];
  });

  assert.deepEqual(await courseModel.findActiveById(8), {
    id: 8,
    title: 'Khóa mẫu',
    description: 'Mô tả',
    level: 'Cơ bản',
    durationHours: 3,
    thumbnailUrl: null,
    isDemo: true,
    criteria: []
  });
});

test('case model limits all reads to active cases and parameterizes IDs', async (t) => {
  const calls = [];
  t.mock.method(pool, 'execute', async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes('ORDER BY RAND()')) {
      return [[{ id: 7, title: 'Tình huống', scenario: 'Nội dung', difficulty: 'Trung bình' }]];
    }
    return [[{ id: 7, trackId: 3, title: 'Tình huống', scenario: 'Nội dung', difficulty: 'Trung bình' }]];
  });

  assert.equal((await caseModel.findRandomActiveByTrack(3)).id, 7);
  assert.equal((await caseModel.findActiveById(7)).trackId, 3);
  assert.ok(calls.every(({ sql }) => /is_active = 1/.test(sql)));
  assert.deepEqual(calls.map(({ values }) => values), [[3], [7]]);
  assert.ok(calls.every(({ sql }) => !/rubric/i.test(sql)));
});
