const test = require('node:test');
const assert = require('node:assert/strict');
const {
  registerSchema,
  loginSchema,
  updateMeSchema
} = require('../src/validators/auth.schemas');

test('registration accepts valid data and normalizes email and name', () => {
  const result = registerSchema.safeParse({
    body: {
      email: '  STUDENT@example.com ',
      password: 'Student123',
      fullName: '  Học viên  '
    }
  });

  assert.equal(result.success, true);
  assert.equal(result.data.body.email, 'student@example.com');
  assert.equal(result.data.body.fullName, 'Học viên');
});

test('registration rejects weak passwords and invalid names', () => {
  for (const body of [
    { email: 'student@example.com', password: '123456', fullName: 'Học viên' },
    { email: 'student@example.com', password: 'passwordonly', fullName: 'Học viên' },
    { email: 'student@example.com', password: 'Student123', fullName: 'A' }
  ]) {
    assert.equal(registerSchema.safeParse({ body }).success, false);
  }
});

test('registration rejects passwords exceeding bcrypt byte limit', () => {
  assert.equal(
    registerSchema.safeParse({
      body: {
        email: 'student@example.com',
        password: `${'Đ'.repeat(40)}1a`,
        fullName: 'Học viên'
      }
    }).success,
    false
  );
});

test('registration accepts Unicode letters in passwords', () => {
  assert.equal(
    registerSchema.safeParse({
      body: {
        email: 'student@example.com',
        password: 'Mậtkhẩu123',
        fullName: 'Học viên'
      }
    }).success,
    true
  );
});

test('login accepts an email and non-empty password', () => {
  assert.equal(
    loginSchema.safeParse({
      body: { email: 'student@example.com', password: 'anything' }
    }).success,
    true
  );
});

test('profile updates require at least one valid change and both password fields', () => {
  assert.equal(updateMeSchema.safeParse({ body: {} }).success, false);
  assert.equal(
    updateMeSchema.safeParse({ body: { newPassword: 'Student456' } }).success,
    false
  );
  assert.equal(
    updateMeSchema.safeParse({
      body: {
        currentPassword: 'Student123',
        newPassword: 'Student456'
      }
    }).success,
    true
  );
});
