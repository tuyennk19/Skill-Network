const pool = require('../config/db');

async function findPage({ search, level, trackId, limit, offset }) {
  const filters = [
    search,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    level,
    level,
    trackId ?? null,
    trackId ?? null
  ];

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM courses c
     WHERE c.is_active = 1
       AND (? = '' OR c.title LIKE ? OR c.description LIKE ? OR EXISTS (
         SELECT 1
         FROM course_criteria search_cc
         JOIN track_criteria search_tc ON search_tc.id = search_cc.criterion_id
         WHERE search_cc.course_id = c.id
           AND (search_tc.name LIKE ? OR search_tc.code LIKE ?)
       ))
       AND (? = '' OR c.level = ?)
       AND (? IS NULL OR EXISTS (
         SELECT 1
         FROM course_criteria cc
         JOIN track_criteria tc ON tc.id = cc.criterion_id
         WHERE cc.course_id = c.id AND tc.track_id = ?
       ))`,
    filters
  );

  const [rows] = await pool.execute(
    `SELECT c.id, c.title, c.description, c.level,
            c.duration_hours AS durationHours,
            c.thumbnail_url AS thumbnailUrl,
            c.is_demo AS isDemo
     FROM courses c
     WHERE c.is_active = 1
       AND (? = '' OR c.title LIKE ? OR c.description LIKE ? OR EXISTS (
         SELECT 1
         FROM course_criteria search_cc
         JOIN track_criteria search_tc ON search_tc.id = search_cc.criterion_id
         WHERE search_cc.course_id = c.id
           AND (search_tc.name LIKE ? OR search_tc.code LIKE ?)
       ))
       AND (? = '' OR c.level = ?)
       AND (? IS NULL OR EXISTS (
         SELECT 1
         FROM course_criteria cc
         JOIN track_criteria tc ON tc.id = cc.criterion_id
         WHERE cc.course_id = c.id AND tc.track_id = ?
       ))
     ORDER BY c.id DESC
     LIMIT ? OFFSET ?`,
    [...filters, limit, offset]
  );

  return {
    items: rows.map((course) => ({ ...course, isDemo: Boolean(course.isDemo) })),
    total: Number(countRows[0].total)
  };
}

async function findActiveById(id) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.title, c.description, c.level,
            c.duration_hours AS durationHours,
            c.thumbnail_url AS thumbnailUrl, c.is_demo AS isDemo,
            tc.id AS criterionId, tc.code AS criterionCode,
            tc.name AS criterionName, tc.description AS criterionDescription,
            t.id AS trackId, t.name AS trackName
     FROM courses c
     LEFT JOIN course_criteria cc ON cc.course_id = c.id
     LEFT JOIN track_criteria tc ON tc.id = cc.criterion_id
     LEFT JOIN career_tracks t ON t.id = tc.track_id
     WHERE c.id = ? AND c.is_active = 1
     ORDER BY t.id, tc.sort_order, tc.id`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const course = {
    id: rows[0].id,
    title: rows[0].title,
    description: rows[0].description,
    level: rows[0].level,
    durationHours: rows[0].durationHours,
    thumbnailUrl: rows[0].thumbnailUrl,
    isDemo: Boolean(rows[0].isDemo),
    criteria: []
  };
  const criteria = new Set();

  for (const row of rows) {
    if (row.criterionId !== null && !criteria.has(row.criterionId)) {
      criteria.add(row.criterionId);
      course.criteria.push({
        id: row.criterionId,
        code: row.criterionCode,
        name: row.criterionName,
        description: row.criterionDescription,
        trackId: row.trackId,
        trackName: row.trackName
      });
    }
  }

  return course;
}

module.exports = { findPage, findActiveById };
