const pool = require('../config/db');

async function findActiveWithCriteria() {
  const [rows] = await pool.execute(
    `SELECT t.id, t.code, t.name, t.description,
            tc.id AS criterionId, tc.code AS criterionCode,
            tc.name AS criterionName, tc.description AS criterionDescription
     FROM career_tracks t
     LEFT JOIN track_criteria tc ON tc.track_id = t.id
     WHERE t.is_active = 1
     ORDER BY t.id, tc.sort_order, tc.id`
  );

  const tracks = new Map();
  for (const row of rows) {
    if (!tracks.has(row.id)) {
      tracks.set(row.id, {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        criteria: []
      });
    }

    if (row.criterionId !== null) {
      tracks.get(row.id).criteria.push({
        id: row.criterionId,
        code: row.criterionCode,
        name: row.criterionName,
        description: row.criterionDescription
      });
    }
  }

  return [...tracks.values()];
}

module.exports = { findActiveWithCriteria };
