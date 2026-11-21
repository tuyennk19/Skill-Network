const pool = require('../config/db');
const HttpError = require('../utils/httpError');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.title, c.description, c.level,
            c.duration_hours AS durationHours, c.thumbnail_url AS thumbnailUrl,
            c.is_demo AS isDemo, c.is_active AS isActive,
            tc.id AS criterionId, tc.code AS criterionCode,
            tc.name AS criterionName, t.id AS trackId, t.name AS trackName
     FROM courses c
     LEFT JOIN course_criteria cc ON cc.course_id = c.id
     LEFT JOIN track_criteria tc ON tc.id = cc.criterion_id
     LEFT JOIN career_tracks t ON t.id = tc.track_id
     ORDER BY c.id DESC, t.id, tc.sort_order, tc.id`
  );

  const courses = new Map();
  for (const row of rows) {
    if (!courses.has(row.id)) {
      courses.set(row.id, {
        id: row.id,
        title: row.title,
        description: row.description,
        level: row.level,
        durationHours: row.durationHours,
        thumbnailUrl: row.thumbnailUrl,
        isDemo: Boolean(row.isDemo),
        isActive: Boolean(row.isActive),
        criteria: []
      });
    }

    if (row.criterionId !== null) {
      courses.get(row.id).criteria.push({
        id: row.criterionId,
        code: row.criterionCode,
        name: row.criterionName,
        trackId: row.trackId,
        trackName: row.trackName
      });
    }
  }
  return [...courses.values()];
}

async function validateCriterionIds(connection, criterionIds) {
  for (const criterionId of criterionIds) {
    const [rows] = await connection.execute(
      'SELECT id FROM track_criteria WHERE id = ? LIMIT 1',
      [criterionId]
    );
    if (rows.length === 0) {
      throw new HttpError(400, 'Một hoặc nhiều tiêu chí không tồn tại.', 'INVALID_CRITERIA');
    }
  }
}

async function insertCriteria(connection, courseId, criterionIds) {
  if (criterionIds.length === 0) {
    return;
  }

  await connection.query(
    'INSERT INTO course_criteria (course_id, criterion_id) VALUES ?',
    [criterionIds.map((criterionId) => [courseId, criterionId])]
  );
}

async function withTransaction(operation) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function create(course) {
  return withTransaction(async (connection) => {
    await validateCriterionIds(connection, course.criterionIds);
    const [result] = await connection.execute(
      `INSERT INTO courses
         (title, description, level, duration_hours, thumbnail_url, is_demo, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        course.title,
        course.description || null,
        course.level,
        course.durationHours ?? null,
        course.thumbnailUrl || null,
        course.isDemo ? 1 : 0,
        course.isActive ? 1 : 0
      ]
    );
    await insertCriteria(connection, result.insertId, course.criterionIds);
    return result.insertId;
  });
}

async function update(id, course) {
  return withTransaction(async (connection) => {
    await validateCriterionIds(connection, course.criterionIds);
    const [result] = await connection.execute(
      `UPDATE courses
       SET title = ?, description = ?, level = ?, duration_hours = ?,
           thumbnail_url = ?, is_demo = ?, is_active = ?
       WHERE id = ?`,
      [
        course.title,
        course.description || null,
        course.level,
        course.durationHours ?? null,
        course.thumbnailUrl || null,
        course.isDemo ? 1 : 0,
        course.isActive ? 1 : 0,
        id
      ]
    );
    if (result.affectedRows === 0) {
      const [rows] = await connection.execute('SELECT id FROM courses WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return 0;
      }
    }
    await connection.execute('DELETE FROM course_criteria WHERE course_id = ?', [id]);
    await insertCriteria(connection, id, course.criterionIds);
    return result.affectedRows || 1;
  });
}

async function deleteById(id) {
  const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { findAll, create, update, deleteById };
