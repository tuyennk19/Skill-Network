const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT t.id, t.code, t.name, t.description, t.is_active AS isActive,
            tc.id AS criterionId, tc.code AS criterionCode,
            tc.name AS criterionName, tc.description AS criterionDescription,
            tc.rubric_low AS rubricLow, tc.rubric_mid AS rubricMid,
            tc.rubric_high AS rubricHigh, tc.sort_order AS sortOrder
     FROM career_tracks t
     LEFT JOIN track_criteria tc ON tc.track_id = t.id
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
        isActive: Boolean(row.isActive),
        criteria: []
      });
    }

    if (row.criterionId !== null) {
      tracks.get(row.id).criteria.push({
        id: row.criterionId,
        code: row.criterionCode,
        name: row.criterionName,
        description: row.criterionDescription,
        rubricLow: row.rubricLow,
        rubricMid: row.rubricMid,
        rubricHigh: row.rubricHigh,
        sortOrder: row.sortOrder
      });
    }
  }

  return [...tracks.values()];
}

async function create({ code, name, description }) {
  const [result] = await pool.execute(
    `INSERT INTO career_tracks (code, name, description)
     VALUES (?, ?, ?)`,
    [code, name, description || null]
  );
  return result.insertId;
}

async function update(id, { code, name, description, isActive }) {
  const [result] = await pool.execute(
    `UPDATE career_tracks
     SET code = ?, name = ?, description = ?, is_active = ?
     WHERE id = ?`,
    [code, name, description || null, isActive ? 1 : 0, id]
  );
  if (result.affectedRows > 0) {
    return result.affectedRows;
  }
  const [rows] = await pool.execute('SELECT id FROM career_tracks WHERE id = ? LIMIT 1', [id]);
  return rows.length;
}

async function deleteById(id) {
  const [result] = await pool.execute('DELETE FROM career_tracks WHERE id = ?', [id]);
  return result.affectedRows;
}

async function createCriterion(trackId, criterion) {
  const [result] = await pool.execute(
    `INSERT INTO track_criteria
       (track_id, code, name, description, rubric_low, rubric_mid, rubric_high, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trackId,
      criterion.code,
      criterion.name,
      criterion.description || null,
      criterion.rubricLow,
      criterion.rubricMid,
      criterion.rubricHigh,
      criterion.sortOrder
    ]
  );
  return result.insertId;
}

async function updateCriterion(id, criterion) {
  const [result] = await pool.execute(
    `UPDATE track_criteria
     SET code = ?, name = ?, description = ?, rubric_low = ?, rubric_mid = ?,
         rubric_high = ?, sort_order = ?
     WHERE id = ?`,
    [
      criterion.code,
      criterion.name,
      criterion.description || null,
      criterion.rubricLow,
      criterion.rubricMid,
      criterion.rubricHigh,
      criterion.sortOrder,
      id
    ]
  );
  if (result.affectedRows > 0) {
    return result.affectedRows;
  }
  const [rows] = await pool.execute('SELECT id FROM track_criteria WHERE id = ? LIMIT 1', [id]);
  return rows.length;
}

async function deleteCriterion(id) {
  const [result] = await pool.execute('DELETE FROM track_criteria WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  findAll,
  create,
  update,
  deleteById,
  createCriterion,
  updateCriterion,
  deleteCriterion
};
