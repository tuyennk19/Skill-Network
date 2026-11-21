require('dotenv').config();

const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');
const pool = require('../src/config/db');

const demoUsers = [
  {
    email: 'admin@skillnetwork.local',
    password: 'Admin@123',
    fullName: 'Quản trị viên',
    role: 'admin'
  },
  {
    email: 'student@skillnetwork.local',
    password: 'Student@123',
    fullName: 'Học viên mẫu',
    role: 'student'
  }
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo accounts must not be seeded in production.');
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  const seedSql = await fs.readFile(path.join(__dirname, 'seed.sql'), 'utf8');
  const statements = seedSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(user.password, rounds);
      await connection.execute(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           full_name = VALUES(full_name),
           role = VALUES(role)`,
        [user.email, passwordHash, user.fullName, user.role]
      );
    }

    for (const statement of statements) {
      await connection.query(statement);
    }

    await connection.commit();
    console.log('Database seed completed.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(`Database seed failed: ${error.message}`);
  process.exitCode = 1;
});
