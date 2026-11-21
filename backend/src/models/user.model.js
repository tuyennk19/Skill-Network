const pool = require('../config/db');

async function create({ email, passwordHash, fullName }) {
  const [result] = await pool.execute(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES (?, ?, ?)`,
    [email, passwordHash, fullName]
  );

  return {
    id: result.insertId,
    email,
    fullName,
    role: 'student'
  };
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, email, password_hash AS passwordHash, full_name AS fullName, role
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, email, full_name AS fullName, role
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function updateFullName(id, fullName) {
  await pool.execute(
    'UPDATE users SET full_name = ? WHERE id = ?',
    [fullName, id]
  );
}

async function updatePassword(id, passwordHash) {
  await pool.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, id]
  );
}

module.exports = { create, findByEmail, findById, updateFullName, updatePassword };
