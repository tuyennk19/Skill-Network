const pool = require('../config/db');

async function findAll(trackId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.track_id AS trackId, t.name AS trackName,
            c.title, c.scenario, c.difficulty, c.is_active AS isActive
     FROM cases c
     JOIN career_tracks t ON t.id = c.track_id
     WHERE (? IS NULL OR c.track_id = ?)
     ORDER BY c.id DESC`,
    [trackId ?? null, trackId ?? null]
  );
  return rows.map((item) => ({ ...item, isActive: Boolean(item.isActive) }));
}

async function create({ trackId, title, scenario, difficulty, isActive }) {
  const [result] = await pool.execute(
    `INSERT INTO cases (track_id, title, scenario, difficulty, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [trackId, title, scenario, difficulty, isActive ? 1 : 0]
  );
  return result.insertId;
}

async function update(id, { trackId, title, scenario, difficulty, isActive }) {
  const [result] = await pool.execute(
    `UPDATE cases
     SET track_id = ?, title = ?, scenario = ?, difficulty = ?, is_active = ?
     WHERE id = ?`,
    [trackId, title, scenario, difficulty, isActive ? 1 : 0, id]
  );
  if (result.affectedRows > 0) {
    return result.affectedRows;
  }
  const [rows] = await pool.execute('SELECT id FROM cases WHERE id = ? LIMIT 1', [id]);
  return rows.length;
}

async function deleteById(id) {
  const [result] = await pool.execute('DELETE FROM cases WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { findAll, create, update, deleteById };
