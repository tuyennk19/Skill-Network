const env = require('../config/env');
const pool = require('../config/db');

const LEVEL_RANK = new Map([
  ['cơ bản', 0],
  ['trung cấp', 1],
  ['nâng cao', 2]
]);

function getLevelRank(level) {
  return LEVEL_RANK.get(String(level).trim().toLocaleLowerCase('vi')) ?? 1;
}

function compareCourses(left, right) {
  if (left.criteria.length !== right.criteria.length) {
    return right.criteria.length - left.criteria.length;
  }

  const leftScore = Math.min(...left.criteria.map(({ score }) => score));
  const rightScore = Math.min(...right.criteria.map(({ score }) => score));
  const leftRank = getLevelRank(left.level);
  const rightRank = getLevelRank(right.level);
  const leftPreference = leftScore < 4 ? leftRank : -leftRank;
  const rightPreference = rightScore < 4 ? rightRank : -rightRank;
  const rankDifference = leftPreference - rightPreference;

  if (rankDifference !== 0) {
    return rankDifference;
  }

  return left.title.localeCompare(right.title, 'vi');
}

async function recommend({ criteria, execute = pool.execute.bind(pool) }) {
  if (!Array.isArray(criteria)) {
    throw new TypeError('criteria must be an array.');
  }

  const weakCriteria = criteria
    .filter(({ score }) => Number(score) < env.WEAK_THRESHOLD)
    .sort((left, right) => Number(left.score) - Number(right.score));

  if (weakCriteria.length === 0) {
    return [];
  }

  if (weakCriteria.some(({ id, code, name }) =>
    !Number.isInteger(Number(id)) || typeof code !== 'string' || typeof name !== 'string'
  )) {
    throw new TypeError('Each weak criterion must include its ID, code, and name.');
  }

  const placeholders = weakCriteria.map(() => '?').join(', ');
  const [rows] = await execute(
    `SELECT c.id AS courseId, c.title, c.level,
            tc.id AS criterionId, tc.code AS criterionCode,
            tc.name AS criterionName
     FROM courses c
     JOIN course_criteria cc ON cc.course_id = c.id
     JOIN track_criteria tc ON tc.id = cc.criterion_id
     WHERE c.is_active = 1 AND tc.id IN (${placeholders})
     ORDER BY c.id, tc.id`,
    weakCriteria.map(({ id }) => Number(id))
  );

  const weakById = new Map(weakCriteria.map((criterion) => [Number(criterion.id), criterion]));
  const courses = new Map();
  for (const row of rows) {
    const weakCriterion = weakById.get(Number(row.criterionId));
    if (!weakCriterion) {
      continue;
    }

    if (!courses.has(row.courseId)) {
      courses.set(row.courseId, {
        courseId: row.courseId,
        title: row.title,
        level: row.level,
        criteria: []
      });
    }
    courses.get(row.courseId).criteria.push(weakCriterion);
  }

  const candidates = [...courses.values()].sort(compareCourses);
  const courseCountByCriterion = new Map();
  const recommendations = [];

  for (const course of candidates) {
    if (recommendations.length >= 6) {
      break;
    }

    const eligibleCriteria = course.criteria.filter(({ id }) =>
      (courseCountByCriterion.get(Number(id)) || 0) < 3
    );
    if (eligibleCriteria.length === 0) {
      continue;
    }

    const coveredCriteria = eligibleCriteria.sort(
      (left, right) => Number(left.score) - Number(right.score)
    );
    const primaryCriterion = coveredCriteria[0];
    const reason = coveredCriteria
      .map(({ name, score }) => `${name} đạt ${Number(score)}/10`)
      .join('; ')
      .slice(0, 255);

    recommendations.push({
      courseId: course.courseId,
      title: course.title,
      criterionId: Number(primaryCriterion.id),
      criterionCode: primaryCriterion.code,
      reason
    });

    for (const criterion of coveredCriteria) {
      const criterionId = Number(criterion.id);
      courseCountByCriterion.set(
        criterionId,
        (courseCountByCriterion.get(criterionId) || 0) + 1
      );
    }
  }

  return recommendations;
}

module.exports = { recommend };
