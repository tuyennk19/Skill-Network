const test = require('node:test');
const assert = require('node:assert/strict');
const { recommend } = require('../src/services/recommend.service');

const criteria = [
  { id: 1, code: 'empathy', name: 'Đồng cảm', score: 3 },
  { id: 2, code: 'objection', name: 'Xử lý phản đối', score: 5 },
  { id: 3, code: 'logic', name: 'Lập luận', score: 7 }
];

test('recommendation skips the query when all criteria meet the threshold', async () => {
  let queried = false;
  const result = await recommend({
    criteria: [{ ...criteria[2], score: 6 }],
    execute: async () => {
      queried = true;
      return [[]];
    }
  });

  assert.deepEqual(result, []);
  assert.equal(queried, false);
});

test('recommendation performs one parameterized query and deduplicates courses', async () => {
  let calls = 0;
  const rows = [
    { courseId: 1, title: 'Kết hợp', level: 'Trung cấp', criterionId: 1, criterionCode: 'empathy', criterionName: 'Đồng cảm' },
    { courseId: 1, title: 'Kết hợp', level: 'Trung cấp', criterionId: 2, criterionCode: 'objection', criterionName: 'Xử lý phản đối' },
    { courseId: 2, title: 'Cơ bản', level: 'Cơ bản', criterionId: 1, criterionCode: 'empathy', criterionName: 'Đồng cảm' },
    { courseId: 3, title: 'Nâng cao', level: 'Nâng cao', criterionId: 1, criterionCode: 'empathy', criterionName: 'Đồng cảm' }
  ];

  const result = await recommend({
    criteria,
    execute: async (sql, values) => {
      calls += 1;
      assert.match(sql, /c\.is_active = 1/);
      assert.match(sql, /tc\.id IN \(\?, \?\)/);
      assert.equal((sql.match(/\?/g) || []).length, values.length);
      assert.deepEqual(values, [1, 2]);
      return [rows];
    }
  });

  assert.equal(calls, 1);
  assert.equal(result.length, 3);
  assert.deepEqual(result[0], {
    courseId: 1,
    title: 'Kết hợp',
    criterionId: 1,
    criterionCode: 'empathy',
    reason: 'Đồng cảm đạt 3/10; Xử lý phản đối đạt 5/10'
  });
  assert.equal(result[1].courseId, 2);
  assert.equal(result[2].courseId, 3);
});

test('recommendation returns no items when weak criteria have no courses', async () => {
  const result = await recommend({
    criteria: [criteria[0]],
    execute: async () => [[]]
  });

  assert.deepEqual(result, []);
});

test('recommendation prefers a lower course level for very weak criteria', async () => {
  const result = await recommend({
    criteria: [criteria[0]],
    execute: async () => [[
      { courseId: 1, title: 'Advanced', level: 'Nâng cao', criterionId: 1 },
      { courseId: 2, title: 'Basic', level: 'Cơ bản', criterionId: 1 }
    ]]
  });

  assert.deepEqual(result.map(({ courseId }) => courseId), [2, 1]);
});

test('recommendation prefers a higher course level for moderately weak criteria', async () => {
  const result = await recommend({
    criteria: [{ ...criteria[1], score: 5 }],
    execute: async () => [[
      { courseId: 1, title: 'Basic', level: 'Cơ bản', criterionId: 2 },
      { courseId: 2, title: 'Advanced', level: 'Nâng cao', criterionId: 2 }
    ]]
  });

  assert.deepEqual(result.map(({ courseId }) => courseId), [2, 1]);
});

test('recommendation caps results at three per criterion and six total', async () => {
  const rows = Array.from({ length: 10 }, (_, index) => ({
    courseId: index + 1,
    title: `Course ${index + 1}`,
    level: 'Cơ bản',
    criterionId: 1,
    criterionCode: 'empathy',
    criterionName: 'Đồng cảm'
  }));
  const result = await recommend({
    criteria: [criteria[0]],
    execute: async () => [rows]
  });

  assert.equal(result.length, 3);
});
