const pool = require('../config/db');

async function findActiveByTrack(trackId) {
  const [rows] = await pool.execute(
    `SELECT id, title, difficulty
     FROM cases
     WHERE track_id = ? AND is_active = 1
     ORDER BY id`,
    [trackId]
  );

  return rows;
}

async function findRandomActiveByTrack(trackId) {
  const [rows] = await pool.execute(
    `SELECT id, title, scenario, difficulty
     FROM cases
     WHERE track_id = ? AND is_active = 1
     ORDER BY RAND()
     LIMIT 1`,
    [trackId]
  );

  return rows[0] || null;
}

async function findActiveById(id) {
  const [rows] = await pool.execute(
    `SELECT id, track_id AS trackId, title, scenario, difficulty
     FROM cases
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findActiveForAssessment(id) {
  const [rows] = await pool.execute(
    `SELECT c.id AS caseId, c.title AS caseTitle, c.scenario,
            t.id AS trackId, t.name AS trackName,
            tc.id AS criterionId, tc.code AS criterionCode,
            tc.name AS criterionName, tc.description AS criterionDescription,
            tc.rubric_low AS rubricLow, tc.rubric_mid AS rubricMid,
            tc.rubric_high AS rubricHigh
     FROM cases c
     JOIN career_tracks t ON t.id = c.track_id
     JOIN track_criteria tc ON tc.track_id = t.id
     WHERE c.id = ? AND c.is_active = 1 AND t.is_active = 1
     ORDER BY tc.sort_order, tc.id`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return {
    id: rows[0].caseId,
    title: rows[0].caseTitle,
    scenario: rows[0].scenario,
    trackId: rows[0].trackId,
    trackName: rows[0].trackName,
    criteria: rows.map((row) => ({
      id: row.criterionId,
      code: row.criterionCode,
      name: row.criterionName,
      description: row.criterionDescription,
      rubricLow: row.rubricLow,
      rubricMid: row.rubricMid,
      rubricHigh: row.rubricHigh
    }))
  };
}

module.exports = {
  findActiveByTrack,
  findRandomActiveByTrack,
  findActiveById,
  findActiveForAssessment
};
