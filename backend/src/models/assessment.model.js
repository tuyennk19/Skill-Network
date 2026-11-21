const pool = require('../config/db');
const { recommend } = require('../services/recommend.service');

async function createAssessment({
  userId,
  caseId,
  trackId,
  answer,
  result,
  isMock,
  criteria
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [assessmentInsert] = await connection.execute(
      `INSERT INTO assessments
         (user_id, case_id, track_id, answer, overall_score, result_json, is_mock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        caseId,
        trackId,
        answer,
        result.overallScore,
        JSON.stringify(result),
        isMock ? 1 : 0
      ]
    );
    const assessmentId = assessmentInsert.insertId;

    for (const criterion of criteria) {
      await connection.execute(
        `INSERT INTO assessment_scores
           (assessment_id, criterion_id, score, comment)
         VALUES (?, ?, ?, ?)`,
        [assessmentId, criterion.id, criterion.score, criterion.comment]
      );
    }

    const recommendations = await recommend({
      criteria,
      execute: connection.execute.bind(connection)
    });

    for (const recommendation of recommendations) {
      await connection.execute(
        `INSERT INTO recommendations
           (assessment_id, course_id, criterion_id, reason)
         VALUES (?, ?, ?, ?)`,
        [
          assessmentId,
          recommendation.courseId,
          recommendation.criterionId,
          recommendation.reason
        ]
      );
    }

    const [createdRows] = await connection.execute(
      'SELECT created_at AS createdAt FROM assessments WHERE id = ?',
      [assessmentId]
    );
    await connection.commit();
    return {
      assessmentId,
      createdAt: new Date(createdRows[0].createdAt).toISOString(),
      recommendations
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'Assessment transaction failed and rollback also failed.'
      );
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function getHistory(userId) {
  const [rows] = await pool.execute(
    `SELECT a.id, c.title AS caseTitle, t.name AS trackName,
            a.overall_score AS overallScore, a.created_at AS createdAt
     FROM assessments a
     JOIN cases c ON c.id = a.case_id
     JOIN career_tracks t ON t.id = a.track_id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC, a.id DESC`,
    [userId]
  );

  return rows;
}

function parseResultJson(value) {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
}

async function getById(userId, id) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.track_id AS trackId, a.case_id AS caseId,
            a.overall_score AS overallScore, a.result_json AS resultJson,
            a.is_mock AS isMock, a.created_at AS createdAt,
            c.title AS caseTitle, t.name AS trackName
     FROM assessments a
     JOIN cases c ON c.id = a.case_id
     JOIN career_tracks t ON t.id = a.track_id
     WHERE a.user_id = ? AND a.id = ?
     LIMIT 1`,
    [userId, id]
  );

  if (rows.length === 0) {
    return null;
  }

  const assessment = rows[0];
  const [scoreRows] = await pool.execute(
    `SELECT tc.code, tc.name, s.score, s.comment
     FROM assessment_scores s
     JOIN track_criteria tc ON tc.id = s.criterion_id
     WHERE s.assessment_id = ?
     ORDER BY tc.sort_order, tc.id`,
    [assessment.id]
  );
  const [recommendationRows] = await pool.execute(
    `SELECT r.course_id AS courseId, c.title, tc.code AS criterionCode, r.reason
     FROM recommendations r
     JOIN courses c ON c.id = r.course_id
     JOIN track_criteria tc ON tc.id = r.criterion_id
     WHERE r.assessment_id = ?
     ORDER BY c.id`,
    [assessment.id]
  );
  const result = parseResultJson(assessment.resultJson);

  return {
    assessmentId: assessment.id,
    trackName: assessment.trackName,
    caseTitle: assessment.caseTitle,
    overallScore: Number(assessment.overallScore),
    criteria: scoreRows.map((criterion) => ({
      code: criterion.code,
      name: criterion.name,
      score: Number(criterion.score),
      comment: criterion.comment
    })),
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    focusTopics: result.focusTopics,
    advice: result.advice,
    recommendations: recommendationRows.map((recommendation) => ({
      courseId: recommendation.courseId,
      title: recommendation.title,
      criterionCode: recommendation.criterionCode,
      reason: recommendation.reason
    })),
    isMock: Boolean(assessment.isMock),
    createdAt: assessment.createdAt
  };
}

async function getAdminList({ trackId, minScore, maxScore, from, to, page }) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const filterValues = [
    trackId ?? null, trackId ?? null,
    minScore ?? null, minScore ?? null,
    maxScore ?? null, maxScore ?? null,
    from ?? null, from ?? null,
    to ?? null, to ?? null
  ];
  const [countResult, [rows]] = await Promise.all([
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM assessments a
       WHERE (? IS NULL OR a.track_id = ?)
         AND (? IS NULL OR a.overall_score >= ?)
         AND (? IS NULL OR a.overall_score <= ?)
         AND (? IS NULL OR a.created_at >= ?)
         AND (? IS NULL OR a.created_at < DATE_ADD(?, INTERVAL 1 DAY))`,
      filterValues
    ),
    pool.execute(
      `SELECT a.id, u.full_name AS fullName, u.email,
              c.title AS caseTitle, t.name AS trackName,
              a.overall_score AS overallScore, a.created_at AS createdAt,
              a.is_mock AS isMock
       FROM assessments a
       JOIN users u ON u.id = a.user_id
       JOIN cases c ON c.id = a.case_id
       JOIN career_tracks t ON t.id = a.track_id
       WHERE (? IS NULL OR a.track_id = ?)
         AND (? IS NULL OR a.overall_score >= ?)
         AND (? IS NULL OR a.overall_score <= ?)
         AND (? IS NULL OR a.created_at >= ?)
         AND (? IS NULL OR a.created_at < DATE_ADD(?, INTERVAL 1 DAY))
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...filterValues, pageSize, offset]
    )
  ]);
  const total = Number(countResult[0][0].total);

  return {
    items: rows.map((item) => ({
      ...item,
      overallScore: Number(item.overallScore),
      isMock: Boolean(item.isMock)
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

async function getAdminById(id) {
  const [rows] = await pool.execute(
    `SELECT a.id, u.full_name AS fullName, u.email,
            c.title AS caseTitle, c.scenario, t.name AS trackName,
            a.answer, a.overall_score AS overallScore,
            a.result_json AS resultJson, a.is_mock AS isMock,
            a.created_at AS createdAt
     FROM assessments a
     JOIN users u ON u.id = a.user_id
     JOIN cases c ON c.id = a.case_id
     JOIN career_tracks t ON t.id = a.track_id
     WHERE a.id = ?
     LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }

  const assessment = rows[0];
  const [scoreRows] = await pool.execute(
    `SELECT tc.code, tc.name, s.score, s.comment
     FROM assessment_scores s
     JOIN track_criteria tc ON tc.id = s.criterion_id
     WHERE s.assessment_id = ?
     ORDER BY tc.sort_order, tc.id`,
    [assessment.id]
  );
  const result = parseResultJson(assessment.resultJson);

  return {
    id: assessment.id,
    fullName: assessment.fullName,
    email: assessment.email,
    caseTitle: assessment.caseTitle,
    scenario: assessment.scenario,
    trackName: assessment.trackName,
    answer: assessment.answer,
    overallScore: Number(assessment.overallScore),
    criteria: scoreRows.map((criterion) => ({
      code: criterion.code,
      name: criterion.name,
      score: Number(criterion.score),
      comment: criterion.comment
    })),
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    focusTopics: result.focusTopics,
    advice: result.advice,
    resultJson: result,
    isMock: Boolean(assessment.isMock),
    createdAt: assessment.createdAt
  };
}

async function getAdminStats() {
  const [studentResult, assessmentResult, scoreRows, dailyRows] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'student'"),
    pool.execute(
      `SELECT COUNT(*) AS total, AVG(overall_score) AS averageScore
       FROM assessments`
    ),
    pool.execute(
      `SELECT t.name AS trackName, AVG(a.overall_score) AS averageScore
       FROM assessments a
       JOIN career_tracks t ON t.id = a.track_id
       GROUP BY t.id, t.name
       ORDER BY t.name`
    ),
    pool.execute(
      `WITH RECURSIVE date_range AS (
         SELECT CURDATE() AS calendar_day
         UNION ALL
         SELECT calendar_day - INTERVAL 1 DAY
         FROM date_range
         WHERE calendar_day > CURDATE() - INTERVAL 6 DAY
       )
       SELECT DATE_FORMAT(d.calendar_day, '%Y-%m-%d') AS date,
              COUNT(a.id) AS count
       FROM date_range d
       LEFT JOIN assessments a
         ON a.created_at >= d.calendar_day
        AND a.created_at < d.calendar_day + INTERVAL 1 DAY
       GROUP BY d.calendar_day
       ORDER BY d.calendar_day`
    )
  ]);

  return {
    totalStudents: Number(studentResult[0][0].total),
    totalAssessments: Number(assessmentResult[0][0].total),
    averageScore: assessmentResult[0][0].averageScore === null
      ? null
      : Number(assessmentResult[0][0].averageScore),
    avgScoreByTrack: scoreRows[0].map((row) => ({
      trackName: row.trackName,
      avg: Number(row.averageScore)
    })),
    last7Days: dailyRows[0].map((row) => ({
      date: row.date,
      count: Number(row.count)
    }))
  };
}

module.exports = {
  createAssessment,
  getHistory,
  getById,
  getAdminList,
  getAdminById,
  getAdminStats
};
